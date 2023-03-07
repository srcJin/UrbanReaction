// import { convertPtToTHREEVector } from './utils';
import * as THREE from 'three';
import * as turf from '@turf/turf';
import {
  getNormalToVector,
  findSegmentIntersection,
  checkPointInPolygon,
  getNearestPointOnLine,
  distance,
  distanceBetweenPointAndLine,
  getVector,
  mod,
  cleanClosedPolygon,
  getVectorBetweenPoints,
  getArea,
  dotProduct,
  makeClockwise,
  polygonsAreEqual,
} from './math-tools';

// import { pointsAreEqual } from '../libs/bool/bool-tools';
// import { distanceToDegrees } from "turf-helpers";
import { convexPartition, removeHoles } from 'poly-partition';
import { Vector3 } from 'three';

// var decomp = require("poly-decomp");

/**chains functions and apply it to the polygon*/
function pointsAreEqual(P1, P2, treshold) {
  let dist3 = Math.sqrt(Math.abs(P2.x - P1.x) ** 2 + Math.abs(P2.y - P1.y) ** 2 + Math.abs(P2.z - P1.z) ** 2);
  return dist3 < treshold;
}

export function chain(polygon, functions, params) {
  //console.log('params', params);
  const polygons = [];
  let currPolygon = polygon;
  for (const fn of functions) {
    const newPolygon = fn(currPolygon, params);
    currPolygon = newPolygon;
    polygons.push(newPolygon);
  }
  return polygons;
}

/**return true if polygon is convex and false if it is concave */
export function checkConvexity(polygon) {
  const angles = getInteriorAngles(polygon);
  for (const angle of angles) {
    if (angle > Math.PI) {
      return false;
    }
  }
  return true;
}
/**check if a polygon has self-intersections. If there is, return the largest polygon formed by the input and clip the rest.*/
export function checkAndUnkinkPolygon(polygon) {
  // check: if kink length > 0, there is self intersection
  const isKinked = checkPolygonKinked(polygon);
  if (isKinked) {
    try {
      const newPolygon = unkinkPolygon(polygon);
      return newPolygon;
    } catch (err) {
      return polygon;
    }
  } else {
    // console.log('no kinks');
    return polygon;
  }
}

export function isPolygonValid(polygon) {
  const isSelfIntersected = checkPolygonKinked(polygon); // returns true if self intersected
  const hasSmallSegment = checkSmallSegment(polygon); // returns true if has small segment
  const hasCollinear = checkCollinear(polygon); // returns true if collinear point detected
  if (isSelfIntersected || hasSmallSegment || hasCollinear) {
    return false;
  }
  return true;
}

export function makePolygonValid(polygon, threshold) {
  if (polygon.length < 3) return polygon;
  polygon = cleanClosedPolygon(polygon, threshold);
  if (polygon.length < 3) return polygon;
  polygon = cleanCollinearPoints(polygon, threshold || 1);
  if (polygon.length < 3) return polygon;
  polygon = checkAndUnkinkPolygon(polygon);
  // console.log('final polygon', polygon);
  return polygon;
}
/**copy an array and remove collinear points found according to specified tolerance*/
export function cleanCollinearPoints(points, tolerance = 0.5) {
  const cleaned = [];
  const nPts = points.length;
  for (let i = -1; i < points.length - 1; i++) {
    const p1 = points[mod(i, nPts)];
    const p2 = points[mod(i + 1, nPts)]; // check
    const p3 = points[mod(i + 2, nPts)];
    const dist = distanceBetweenPointAndLine(p1, p2, p3);
    if (dist > tolerance) cleaned.push(p2);
  }
  return cleaned;
}
export function checkCollinear(polygon) {
  const toRemove = [];
  //   for (let i = 0; i < polygon.length; i++) {
  //     polygon[i] = convertPtToTHREEVector(polygon[i]);
  //   }
  for (let i = 0; i < polygon.length; i++) {
    const p1 = polygon[i];
    const p2 = polygon[(i + 1) % polygon.length]; // check
    const p3 = polygon[(i + 2) % polygon.length];
    const slope1 = p2.clone().sub(p1).normalize();
    const slope2 = p3.clone().sub(p2).normalize();
    // console.log('slope 1', slope1, 'slope 2', slope2);
    if (pointsAreEqual(slope1, slope2)) {
      toRemove.push((i + 1) % polygon.length);
      // console.log("COLLINEAR POINT DETECTED");
      return true;
    }
  }
  return false;
}
export function checkPolygonKinked(polygon) {
  const closedPolygon = closeOpenPolygon(polygon);
  const XYInput = closedPolygon.map((pt) => {
    return [pt.x, pt.z];
  });
  const XYTurf = turf.polygon([XYInput]); //polygon expects a nested array. [[[x1, y1], [x2, y2], [x3, y3]...]]
  const kinks = turf.kinks(XYTurf);
  // console.log('kinks', kinks);
  // console.log('kinks features length', kinks.features.length);
  if (kinks.features.length > 0) {
    return true;
  }
  return false;
}

export function checkSmallSegment(polygon, tolerance = 0.01) {
  const segments = [];
  for (let i = 0; i < polygon.length; i++) {
    const pair = [polygon[i], polygon[(i + 1) % polygon.length]];
    segments.push(pair);
  }
  for (let i = 0; i < segments.length; i++) {
    if (distance(segments[i][0], segments[i][1]) < tolerance) {
      return true;
    }
  }
  return false;
}

/**takes in an array of points that form a polygon that may be self-intersecting. return the largest polygon formed by the input*/
export function unkinkPolygon(inputPolygon) {
  let polygon = [...inputPolygon];
  // when there is self-intersection, split the polygon into multiple simple polygons. Return the largest polygon
  //note: turf takes in x and y coordinates. xyz polygon needs to be converted first
  // turf expects first and last position to be equal
  const closedPolygon = closeOpenPolygon(polygon);
  const XYInput = closedPolygon.map((pt) => {
    return [pt.x, pt.z];
  });
  const XYTurf = turf.polygon([XYInput]); //polygon expects a nested array. [[[x1, y1], [x2, y2], [x3, y3]...]]
  var result = turf.unkinkPolygon(XYTurf);

  const XYZPoly = XYTurf.geometry.coordinates[0].map((pt) => {
    return { x: pt[0], y: 0, z: pt[1] };
  });
  const newPolygons = [];
  const areas = [];
  // convert turf xy array to xyz object
  for (const feature of result.features) {
    const newPolygon = feature.geometry.coordinates[0].map((pt) => {
      return { x: pt[0], y: 0, z: pt[1] };
    });
    newPolygons.push(newPolygon);
  }
  // find the areas of the different resultant polygons
  for (const newPolygon of newPolygons) {
    const area = getArea(newPolygon);
    areas.push(area);
  }
  const index = getIndexOfMax(areas);
  const XYZResult = newPolygons[index];
  var specimen = [XYZPoly, XYZResult];
  const cleanedShape = cleanClosedPolygon(XYZResult);
  // console.log('cleaned', cleanedShape);
  return cleanedShape;
}

export function RemoveHoles(polygon, holes) {
  // triangulate polygon
  // remove non-essential partition. For each reflex angle, it will have at most 2 essential partition

  function toPt2(polygon) {
    return polygon.map((pt) => ({ x: pt.x, y: pt.z }));
  }
  function toPt3(polygon) {
    return polygon.map((pt) => new Vector3(pt.x, 0, pt.y));
  }
  const _polygon = toPt2(polygon);
  const _holes = holes.map((hole) => makeClockwise(toPt2(hole)));

  const result = removeHoles(_polygon, _holes, true);

  // console.log("convexes", convexes);
  return toPt3(result);
}

//reference: https://www.cs.jhu.edu/~misha/Spring16/05.pdf
/**takes in an array of points and return a nested array of polygon(s)*/
export function convexPartitioning(polygon) {
  // triangulate polygon
  // remove non-essential partition. For each reflex angle, it will have at most 2 essential partition
  const polygon2d = polygon.map((pt) => {
    return { x: pt.x, y: pt.z };
  });
  const XYconvexes = convexPartition(polygon2d, true);
  const convexes = [];
  for (const convex of XYconvexes) {
    const XYZconvex = convex.map((pt) => {
      return { x: pt.x, y: 0, z: pt.y };
    });
    convexes.push(XYZconvex);
  }
  // console.log("convexes", convexes);
  return convexes;
}

// gives better result in terms of maximising the area of the resultant polygon
/**calculate triangular area formed by adjacent edges, if resultant area is within polygon. Delete segments from the smallest area.*/
export function simplifyPolygonRecursive(polygon, params) {
  let { n } = params;
  // works for counterclockwise points
  // console.log("isClockwise", isClockWise(polygon));
  unkinkPolygon(polygon);
  const newPolygon = [...polygon];
  if (n == 0 || polygon.length <= 3) {
    return polygon;
  }
  // ensure points are clockwise
  const vectors = getVectors(polygon);
  const angles = getInteriorAngles(polygon);
  const triangles = getTriangleAreas(angles, vectors);
  triangles.sort((a, b) => {
    return a[0] - b[0];
  }); // sorted in ascending order
  const index = triangles[0][1];
  newPolygon.splice(index, 1);
  n--;
  const shape = simplifyPolygonRecursive(newPolygon, { n });
  return shape;
}

function getIndexOfMax(arr) {
  if (arr.length === 0) {
    return -1;
  }

  var max = arr[0];
  var maxIndex = 0;

  for (var i = 1; i < arr.length; i++) {
    if (arr[i] > max) {
      maxIndex = i;
      max = arr[i];
    }
  }

  return maxIndex;
}

/**if end point is not equal to first point, add first point the array. i.e. close the loop.*/
function closeOpenPolygon(polygon) {
  const closedPolygon = [...polygon];
  // console.log('closeOpenPolygon:: ', polygon);
  if (!pointsAreEqual(polygon[0], polygon[polygon.length - 1])) {
    closedPolygon.push(closedPolygon[0]);
  }
  return closedPolygon;
}
function getVectors(polygon) {
  const vectors = [];
  for (let i = 0; i < polygon.length; i++) {
    const vector = getVectorBetweenPoints(polygon[i], polygon[(i + 1) % polygon.length]);
    vectors.push(vector);
  }
  return vectors;
}

/**get triangular areas bounded by two adjacent edges and the angle between them */
function getTriangleAreas(angles, vectors) {
  const areas = [];
  for (let i = 0; i < angles.length; i++) {
    if (angles[i] > Math.PI) continue;
    const v1 = vectors[mod(i - 1, vectors.length)];
    const v2 = vectors[i];
    const area = 0.5 * v1.length() * v2.length() * Math.sin(angles[i]);
    areas.push([area, i]);
  }

  return areas;
}

/**takes in a polygon and return an array of the interior angles in radian. Set returnRad to false for output in degrees format */
export function getInteriorAngles(polygon, returnRad = true) {
  const angles = [];
  const vectors = [];
  for (let i = 0; i < polygon.length; i++) {
    const vector = getVectorBetweenPoints(polygon[i], polygon[(i + 1) % polygon.length]);
    vectors.push(vector);
  }
  // get interior angles between vectors
  for (let i = 0; i < vectors.length; i++) {
    const v1 = vectors[mod(i - 1, vectors.length)].clone().multiplyScalar(-1); // reverse direction so it starts from the same point
    const v2 = vectors[i].clone(); // end vector
    const angle1 = angleBetweenVectorAndXaxis(v1);
    const angle2 = angleBetweenVectorAndXaxis(v2);
    let angle = angle2 - angle1;
    if (angle > 2 * Math.PI) angle %= 2 * Math.PI;
    if (angle < 0) angle = 2 * Math.PI + angle;
    if (!returnRad) angle = (angle / (2 * Math.PI)) * 360; // convert rad to degrees
    angles.push(angle);
  }
  return angles;
}

/**return angle counterclockwise from the x axis to the vector, in radian */
function angleBetweenVectorAndXaxis(v1) {
  return Math.atan2(v1.x, v1.z);
}

export function offsetMultipleEdges(shape, value, edgeIndexes) {
  const segments = getSegments(shape);
  const normals = this.getNormals(segments, shape);
  // console.log('normals', normals);
  const bisectors = getBisectors(normals);
  // if offset outward, use bisector method
  const newShape = this.getNewShape(shape, bisectors, value);
  return newShape;
}
function getSegments(shape) {
  const segments = [];
  for (let i = 0; i < shape.length - 1; i++) {
    const segment = [shape[i], shape[i + 1]];
    segments.push(segment);
  }
  if (shape[0] != shape[shape.length - 1]) {
    const segment = [shape[shape.length - 1], shape[0]];
    segments.push(segment);
  }

  // findSegmentIntersection()
  return segments;
}

function getBisectors(normals) {
  const bisectors = [];
  for (let i = 0; i < normals.length - 1; i++) {
    const na = normals[i].clone();
    const nb = normals[i + 1].clone();
    const bisector = na.clone().add(nb);
    bisector.normalize();
    bisectors.push({ bisector, na, nb });
  }
  // last bisector
  const na = normals[normals.length - 1].clone();
  const nb = normals[0].clone();
  const bisector = na.clone().add(nb);
  bisector.normalize();
  bisectors.push({ bisector, na, nb });
  return bisectors;
}
function getNewShape(shape, bisectors, value) {
  const newShape = [];
  for (let i = 0; i < shape.length; i++) {
    const bisector = bisectors[i - 1].bisector;
    const dist =
      value /
      Math.sqrt(
        (1 + dotProduct(bisectors[mod(i - 1, bisectors.length)].na, bisectors[mod(i - 1, bisectors.length)].nb)) / 2
      );
    const delta = bisector.clone().multiplyScalar(dist);
    const b = shape[i].clone().add(delta);
    // shape[i] = b;
    newShape.push(b);
  }
  return newShape;
}
/**offset one edge. positive distance for outward offset and negative dist for inward offset. */
let count = 0;
export function offsetEdge(polygon, params) {
  count++;
  // console.log('count', count);
  // console.log('polygon', polygon);
  //console.log('dist', dist);
  let { index, dist } = params;
  polygon = polygon.map((pt) => getVector(pt));
  index = index % polygon.length;
  if (dist == 0) return polygon;
  const edges = getEdges(polygon);
  // find limits
  const edge = edges[index];
  const prevEdge = edges[mod(index - 1, edges.length)];
  const nextEdge = edges[mod(index + 1, edges.length)];
  const normals = getNormals(edges, polygon);
  const normal = normals[index];
  const limits = findAllLimits(polygon, edges, normals, index);
  const neighbouringLimits = findNeighbouringLimits(edges, normal, index);
  const { min, minIndex } = getMaxOffset([...limits, ...neighbouringLimits], dist);
  const intersectionVal = findNeighbouringIntersection(edge, prevEdge, nextEdge, normal);
  const limit = findLimit(dist, min, intersectionVal, neighbouringLimits, minIndex, index, polygon.length);

  let newShape;
  // exit conditions
  if (Math.abs(dist) < Math.abs(limit.val)) {
    newShape = basicOffsetEdge(polygon, edges, normals, index, dist);
    const { cleanedShape } = cleanPolygon(newShape, 0.01);
    count = 0;
    return cleanedShape;
  }
  newShape = basicOffsetEdge(polygon, edges, normals, index, limit.val);
  // console.log('new', newShape);
  // console.log('old', polygon);
  if (polygonsAreEqual(newShape, polygon)) {
    console.log('same polygon');
    count = 0;
    return newShape;
  }
  let { cleanedShape, removedEdgeIndex } = cleanPolygon(newShape, 0.01);
  const newDist = dist - limit.val;
  if (removedEdgeIndex.length > 0) index = getNewIndex(index, removedEdgeIndex, cleanedShape.length); // assign new value to index
  if (limit.type == 'intersection') {
    count = 0;
    return cleanedShape;
  }

  if (count > 50) {
    console.log('too much of iterations');
    count = 0;
    return cleanedShape;
  }
  //check if any point is touching other line segments except for its neigbouring segment.
  const isTouching = isPointTouching(cleanedShape, index);
  if (isTouching) {
    count = 0;
    return cleanedShape;
  }
  if (cleanedShape.length < 3) {
    count = 0;
    return polygon;
  }

  cleanedShape = offsetEdge(cleanedShape, { index, dist: newDist });

  return cleanedShape;
}

/**find the offset distance limits between neighbouring edges and all other edges */
function findNeighbouringLimits(edges, normal, index) {
  const neighbouringLimits = [];
  const prevIndex = mod(index - 1, edges.length);
  const nextIndex = mod(index + 1, edges.length);
  const prevPrevIndex = mod(index - 2, edges.length);
  const nextNextIndex = mod(index + 2, edges.length);
  const edge = edges[index];
  const prevEdge = edges[mod(index - 1, edges.length)];
  const nextEdge = edges[mod(index + 1, edges.length)];
  const prevIntersects = [];
  const nextIntersects = [];
  const noCheckPrev = [prevIndex, nextIndex, prevPrevIndex, index];
  const noCheckNext = [prevIndex, nextIndex, nextNextIndex, index];
  // console.log("edge", edge);
  // console.log("prevedge", prevEdge);
  for (let i = 0; i < edges.length; i++) {
    if (noCheckPrev.includes(i)) {
      continue;
    }
    const intersect = findSegmentIntersection(edges[i][0], edges[i][1], prevEdge[0], prevEdge[1]);
    if (intersect) prevIntersects.push(intersect);
    // console.log("prevIntersects", prevIntersects);
  }
  for (let i = 0; i < edges.length; i++) {
    if (noCheckNext.includes(i)) {
      continue;
    }
    const intersect = findSegmentIntersection(edges[i][0], edges[i][1], nextEdge[0], nextEdge[1]);
    if (intersect) nextIntersects.push(intersect);
    // console.log("prevIntersects", prevIntersects);
  }

  for (const pt of prevIntersects) {
    const dist = findDist(edge, normal, pt);
    neighbouringLimits.push(dist);
  }
  for (const pt of nextIntersects) {
    const dist = findDist(edge, normal, pt);
    neighbouringLimits.push(dist);
  }

  return neighbouringLimits;
}

function findDist(edge, normal, point) {
  const projectedPt = getNearestPointOnLine(edge[0], edge[1], point);
  const deltaVector = point.clone().sub(projectedPt); // projectedPt is the start point. Vector points from projectedPt to point
  const dist = deltaVector.length();
  if (deltaVector.clone().normalize().distanceTo(normal) < 0.001) return dist;
  if (deltaVector.clone().normalize().multiplyScalar(-1).distanceTo(normal) < 0.001) return -dist;
}

/**check if any of the points are touching any other edges. return true if there is. */
function isPointTouching(polygon, index) {
  const edges = getEdges(polygon);
  for (let i = 0; i < edges.length; i++) {
    const edge = edges[i];
    for (let j = 0; j < polygon.length; j++) {
      if (j == i || j == (i + 1) % polygon.length) continue;
      if (isPointOnLineSegment(edge[0], edge[1], polygon[j])) return true;
    }
  }
  return false;
}

/**check if a point lies on a line segment. optional to specify tolerance. */
function isPointOnLineSegment(p1, p2, point, tol = 0.001) {
  if (distanceBetweenPointAndLine(p1, p2, point) > tol) return false;
  const projectedPt = getNearestPointOnLine(p1, p2, point);
  const edgeLength = p1.distanceTo(p2);
  const p1ToPoint = p1.distanceTo(projectedPt);
  const p2ToPoint = p2.distanceTo(projectedPt);
  if (p1ToPoint <= 0.0001 || p2ToPoint < 0.0001) return false; // same position as start or end is not counted as being on the line segment
  if (p1ToPoint < edgeLength && p2ToPoint < edgeLength) return true;
  return false;
}
function findLimit(value, min, intersectionVal, neighbouringLimits, minIndex, edgeIndex, len) {
  let limit;
  let type;
  const nextPtIndex = mod(edgeIndex + 2, len);
  const prevPtIndex = mod(edgeIndex - 1, len);
  if (value < 0) {
    // offset inward
    if (intersectionVal < 0 && min < 0) {
      limit = Math.max(intersectionVal, min);
      if (limit === intersectionVal) type = 'intersection';
      else if (minIndex != nextPtIndex && minIndex != prevPtIndex) type = 'minBetween';
      else {
        type = 'min';
      }
    } else if (intersectionVal < 0) {
      limit = intersectionVal;
      type = 'intersection';
    } else if (min < 0) {
      limit = min;
      type = 'min';
      if (minIndex != nextPtIndex && minIndex != prevPtIndex) type = 'minBetween';
    }
  } else if (value > 0) {
    if (intersectionVal > 0 && min > 0) {
      limit = Math.min(intersectionVal, min);
      if (limit === intersectionVal) type = 'intersection';
      if (limit === min) type = 'min';
    } else if (intersectionVal > 0) {
      limit = intersectionVal;
      type = 'intersection';
    } else if (min > 0) {
      limit = min;
      type = 'min';
      if (minIndex != nextPtIndex && minIndex != prevPtIndex) type = 'minBetween';
    }
  }

  if (!limit) limit = value;
  return { val: limit, type };
}

function getNewIndex(index, removedEdgeIndex, len) {
  // console.log("getting new index");
  for (const i of removedEdgeIndex) {
    if (index > i) {
      // console.log("returned index", mod(index - 1, len));
      return mod(index - 1, len);
    }
  }
  return index;
}
function basicOffsetEdge(shape, segments, normals, edgeIndex, value) {
  const prevEdge = segments[mod(edgeIndex - 1, segments.length)];
  const nextEdge = segments[mod(edgeIndex + 1, segments.length)];
  const deltaVector = normals[edgeIndex].clone().multiplyScalar(value);
  const newEdge = getNewEdge(segments[edgeIndex], segments, edgeIndex, deltaVector);

  const prevIntersect = findSegmentIntersection(newEdge[0], newEdge[1], prevEdge[0], prevEdge[1]);
  const nextIntersect = findSegmentIntersection(newEdge[0], newEdge[1], nextEdge[0], nextEdge[1]);
  let newShape = [];
  for (let i = 0; i < shape.length; i++) {
    newShape.push(shape[i]);
  }
  if (nextIntersect) newShape[(edgeIndex + 1) % newShape.length] = nextIntersect;
  if (prevIntersect) newShape[edgeIndex] = prevIntersect;
  return newShape;
}

function getNewEdge(edge, edges, index, deltaVector) {
  const a = new THREE.Vector3(edge[0].x + deltaVector.x, edge[0].y + deltaVector.y, edge[0].z + deltaVector.z);

  const b = new THREE.Vector3(edge[1].x + deltaVector.x, edge[1].y + deltaVector.y, edge[1].z + deltaVector.z);
  // segments[index] = [a, b];
  return [a, b];
}
function findNeighbouringIntersection(edge, prevEdge, nextEdge, normal) {
  // const prevSegmentIndex = edgeIndex == 0 ? segments.length - 1 : edgeIndex - 1;
  // const nextSegmentIndex = edgeIndex == segments.length - 1 ? 0 : edgeIndex + 1;
  let intersectionVal;

  const intersectionPt = findSegmentIntersection(prevEdge[0], prevEdge[1], nextEdge[0], nextEdge[1]);
  if (!intersectionPt) return (intersectionVal = 99999999999);
  const intersectionDist = distanceBetweenPointAndLine(edge[0], edge[1], intersectionPt);
  const projectedPt = getNearestPointOnLine(edge[0], edge[1], intersectionPt);

  const deltaVector = new THREE.Vector3(
    intersectionPt.x - projectedPt.x,
    intersectionPt.y - projectedPt.y,
    intersectionPt.z - projectedPt.z
  );
  const dirVector = deltaVector.normalize();
  const isEqual = pointsAreEqual(dirVector, normal);
  if (isEqual) intersectionVal = intersectionDist;
  else if (!isEqual) intersectionVal = -intersectionDist;
  return intersectionVal;
}

function findAllLimits(shape, edges, normals, index) {
  const thresholds = [];
  const edge = edges[index];
  for (let i = 0; i < shape.length; i++) {
    const point = getVector(shape[i]);
    const projectedPoint = getNearestPointOnLine(edge[0], edge[1], point);
    const threshold = new THREE.Vector3(
      point.x - projectedPoint.x,
      point.y - projectedPoint.y,
      point.z - projectedPoint.z
    );
    const thresholdVal = threshold.length();
    const thresholdNormalized = threshold.clone().normalize();
    const oriEqual = pointsAreEqual(thresholdNormalized, normals[index], 0.01);
    const reversedEqual = pointsAreEqual(thresholdNormalized.clone().multiplyScalar(-1), normals[index], 0.01);
    if (oriEqual) {
      thresholds.push(thresholdVal);
    } else if (reversedEqual) {
      thresholds.push(-thresholdVal);
    } else {
      thresholds.push(99999);
    }
  }

  return thresholds;
}

function getMaxOffset(limits, val) {
  let min = 9999;
  let minIndex;
  if (val > 0) {
    for (let i = 0; i < limits.length; i++) {
      if (limits[i] < 0) {
        break;
      }
      if (limits[i] < min) {
        min = limits[i];
        minIndex = i;
      }
    }
  }
  if (val < 0) {
    for (let i = 0; i < limits.length; i++) {
      if (limits[i] > 0) {
        continue;
      } else if (Math.abs(limits[i]) < Math.abs(min)) {
        min = limits[i];
        minIndex = i;
      }
    }
  }

  return { min, minIndex };
}

export function cleanPolygon(points, tolerance = 1) {
  const segments = [];
  const removedEdgeIndex = [];
  const filteredSegments = [];
  for (let i = 0; i < points.length; i++) {
    const pair = [points[i], points[(i + 1) % points.length]];
    segments.push(pair);
  }
  // check length of segment
  // const filteredSegments = segments.filter((segment) => {
  //   if (distance(segment[0], segment[1]) < tolerance) {
  //     return false;
  //   }
  //   return true;
  // })
  for (let i = 0; i < segments.length; i++) {
    //if at least one point of a given segment is undefined, then remove this segment
    if (!segments[i][0] || !segments[i][1]) {
      removedEdgeIndex.push(i);
      continue;
    }
    let dist = distance(segments[i][0], segments[i][1]);
    if (dist < tolerance) {
      removedEdgeIndex.push(i);
    } else {
      filteredSegments.push(segments[i]);
    }
  }
  const cleanedShape = [];
  // cleanedShape.push(segments[0][0]);
  // for (const segment of filteredSegments) {
  //   cleanedShape.push(segment[1]);
  // }
  for (const segment of filteredSegments) {
    cleanedShape.push(segment[0]);
  }
  return { cleanedShape, removedEdgeIndex };
}

export function removeClosePoints(points, tolerance = 1) {
  const polygon = [];
  for (let i = 0; i < points.length; i++) {
    let dist = points[i].distanceTo(points[(i + 1) % points.length]);
    if (dist > tolerance) {
      polygon.push(points[i]);
    }
  }
  return polygon;
}

function getEdges(shape) {
  const edges = [];
  for (let i = 0; i < shape.length; i++) {
    const edge = [shape[i], shape[(i + 1) % shape.length]];
    edges.push(edge);
  }
  // if (shape[0] != shape[shape.length - 1]) {
  //   const edge = [shape[shape.length - 1], shape[0]];
  //   edges.push(edge);
  // }
  //console.log('edges', edges);
  // findSegmentIntersection()
  return edges;
}
function checkLimits(limits) {}

function getEdge(polygon, index) {
  const len = polygon.length;
  const i = index % len,
    j = (index + 1) % len;
  return [polygon[i], polygon[j]];
}

function getNormals(edges, polygon) {
  // normals is directed outward of the polygon
  const normals = [];

  edges.forEach((edge) => {
    const dir = new THREE.Vector3(edge[1].x - edge[0].x, edge[1].y - edge[0].y, edge[1].z - edge[0].z);
    const normal = getNormalToVector(dir);
    normals.push(normal);
  });
  const firstMidPt = new THREE.Vector3(
    (edges[0][0].x + edges[0][1].x) / 2,
    (edges[0][0].y + edges[0][1].y) / 2,
    (edges[0][0].z + edges[0][1].z) / 2
  );
  const pt = firstMidPt.clone().add(normals[0]);
  const isInside = checkPointInPolygon(pt, polygon);
  // check if one normal is inside polygon. If it is, reverse all normals
  if (isInside) normals.map((normal) => normal.multiplyScalar(-1));
  return normals;
}
