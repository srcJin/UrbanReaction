import { Vector3 } from 'three';
import { getDifference, getIntersection, getIntersections, getUnion } from '../clipper/clipper-tools.js';
import polylabel from '../polylabel/polylabel.js';
// import turf from 'turf';
import * as turf from '@turf/turf';
import { intersection } from 'lodash';
import { EdgesensorHigh } from '@mui/icons-material';
import { pointLine } from '../meshEditor/libs/intersects';
import { radToDeg } from 'three/src/math/MathUtils';
import { offsetPipeButt } from './math-primitives';
import { getUnions } from '../clipper/clipper-tools.js';

const { sin, cos, acos, abs, PI, min, random, pow, sqrt, round, floor, ceil } = Math;

//Might have a copy of this function somewhere, check later
export function getVector(pt) {
  return new Vector3(pt.x, pt.y, pt.z);
}
export function getSegments(shape) {
  const segments = [];
  for (let i = 0; i < shape.length - 1; i++) {
    const segment = [shape[i], shape[i + 1]];
    segments.push(segment);
  }
  if (shape[0] !== shape[shape.length - 1]) {
    const segment = [shape[shape.length - 1], shape[0]];
    segments.push(segment);
  }
  return segments;
}
/** Get specific number of slices from a bounding rectangle*/
// export function getBRectSlices(bRect, nSlices/*, alongLongSide*/) {

//     const slices = []

//     let a, b, c, d

//     if(bRect.length > bRect.width) {
//         a = bRect.points[0], b = bRect.points[3], c = bRect.points[2], d = bRect.points[1]
//     }
//     else {
//         a = bRect.points[0], b = bRect.points[1], c = bRect.points[2], d = bRect.points[3]
//     }

//     const s1 = [],
//         s2 = []

//     for (var i = 1; i < nSlices; i++) {

//         s1.push(pointOnLine(a, b, i / nSlices))
//         s2.push(pointOnLine(d, c, i / nSlices))
//     }

//     for (var i = 0; i < nSlices; i++) {

//         if (i === 0) {
//             slices.push([a, s1[i], s2[i], d])
//             continue;
//         } else if (i === nSlices - 1) {
//             slices.push([s1[i - 1], b, c, s2[i - 1]])
//             continue;
//         }

//         slices.push([s1[i - 1], s1[i], s2[i], s2[i - 1]])
//     }

//     return slices;

// }

export function getBRectRatioSlices(bRect, ratio /*, alongLongSide*/) {
  const slices = [];

  let a, b, c, d;

  if (bRect.length > bRect.width) {
    a = bRect.points[0];
    b = bRect.points[3];
    c = bRect.points[2];
    d = bRect.points[1];
  } else {
    a = bRect.points[0];
    b = bRect.points[1];
    c = bRect.points[2];
    d = bRect.points[3];
  }

  const s1 = [],
    s2 = [];

  for (var i = 1; i < ratio.length; i++) {
    s1.push(pointOnLine(a, b, ratio[i]));
    s2.push(pointOnLine(d, c, ratio[i]));
  }

  for (var i = 0; i < ratio.length; i++) {
    if (i === 0) {
      slices.push([a, s1[i], s2[i], d]);
      continue;
    } else if (i === ratio.length - 1) {
      slices.push([s1[i - 1], b, c, s2[i - 1]]);
      continue;
    }

    slices.push([s1[i - 1], s1[i], s2[i], s2[i - 1]]);
  }

  return slices;
}

export function getRadialSlices(polygon, startAngle, nArms, cutWidth) {
  const increment = (2 * Math.PI) / nArms;
  startAngle = rad(startAngle);
  const xAxis = new Vector3(1, 0, 0);
  const center = getAveragePoint(polygon);
  const shapes = [];

  for (let i = 0; i < nArms; i++) {
    const angle = startAngle + increment * i;
    const dir = rotateVector2D(xAxis.clone(), angle, true);
    const intersect = raycastToPolygon(center, dir, polygon);
    const extended = intersect.add(intersect.clone().sub(center).normalize().multiplyScalar(5));
    let shape = offsetPipeButt([center, extended], cutWidth);
    shapes.push(shape);
  }

  let union = getUnion(shapes);
  const slices = getDifference(polygon, [union]);

  return slices;
}

export function getParallelSlices(polygon, angle, nSlices) {
  let bRect = angle ? getBoundingRectangle(polygon, angle) : getMinimumAABB(polygon);

  const ratio = [];
  for (var i = 0; i < nSlices; i++) {
    ratio.push(i / nSlices);
  }

  // const slices = getBRectSlices(bRect, nSlices, true), divisions = []
  const slices = getBRectRatioSlices(bRect, ratio, true),
    divisions = [];

  for (const slice of slices) {
    const intersections = getIntersections(slice, polygon);

    divisions.push(...intersections);
  }

  return divisions;
}

export function getParallelRatioSlices(polygon, angle, ratio) {
  let bRect = angle ? getBoundingRectangle(polygon, angle) : getMinimumAABB(polygon);

  // const slices = getBRectSlices(bRect, nSlices, true), divisions = []
  const slices = getBRectRatioSlices(bRect, ratio, true),
    divisions = [];
  for (const slice of slices) {
    const intersections = getIntersections(slice, polygon);

    if (!intersections) {
      // @TODO: check with tejas
      continue;
      // return null;
    }

    divisions.push(...intersections);
  }

  return divisions;
}

export function scalePointsFromCenter(points, fac) {
  const center = getAveragePoint(points);
  return points.map((pt) => scaleVector(pt, center, fac));
}

function scaleVector(v, ref, fac) {
  const dir = v.clone().sub(ref);
  dir.multiplyScalar(fac);
  return ref.clone().add(dir);
}

export function halveWithCuttingThickness(pList, orientation, boolSmallestBBox, randomOrientationBool, thickness) {
  let bRect,
    divisions = [];

  if (randomOrientationBool) {
    bRect = getBoundingRectangle(pList, random() * 180); //changed from smallestBRect() _tj
  } else if (boolSmallestBBox == false && randomOrientationBool == false) {
    bRect = getBoundingRectangle(pList, orientation);
  } else {
    bRect = getMinimumAABB(pList);
  }
  //scaling is necessary for better subdivision
  bRect.points = scalePointsFromCenter(bRect.points, 1.01);

  // let len = pList.length;
  const pts = bRect.points;

  let bbox_l, bbox_r;

  // const fac = 0.52;

  if (bRect.length > bRect.width) {
    const ratio = thickness / bRect.length / 2;
    const fac = 0.5 + ratio;
    bbox_l = [pts[0], pts[1], lerp(pts[2], pts[1], fac), lerp(pts[3], pts[0], fac)];
    bbox_r = [lerp(pts[0], pts[3], fac), lerp(pts[1], pts[2], fac), pts[2], pts[3]];
  } else {
    const ratio = thickness / bRect.width / 2;
    const fac = 0.5 + ratio;
    bbox_l = [lerp(pts[0], pts[1], fac), pts[1], pts[2], lerp(pts[3], pts[2], fac)];
    bbox_r = [pts[0], lerp(pts[1], pts[0], fac), lerp(pts[2], pts[3], fac), pts[3]];
  }

  const union_l = getIntersections(bbox_l, pList);
  const union_r = getIntersections(bbox_r, pList);

  // console.log('Using minimumAABB', { pList, union_l, union_r });

  return { slices: [...union_l, ...union_r], center: getAveragePoint(bRect.points) };
}

export function halve(pList, orientation, boolSmallestBBox, randomOrientationBool) {
  let bRect,
    divisions = [];

  if (randomOrientationBool) {
    bRect = getBoundingRectangle(pList, random() * 180); //changed from smallestBRect() _tj
  } else if (boolSmallestBBox == false && randomOrientationBool == false) {
    bRect = getBoundingRectangle(pList, orientation);
  } else {
    bRect = getMinimumAABB(pList);
  }
  //scaling is necessary for better subdivision
  bRect.points = scalePointsFromCenter(bRect.points, 1.01);

  // let len = pList.length;
  const pts = bRect.points;

  /* bRect.midPts = [
    new Vector3((bRect.points[0].x + bRect.points[1].x) * 0.5, 0, (bRect.points[0].z + bRect.points[1].z) * 0.5),
    new Vector3((bRect.points[1].x + bRect.points[2].x) * 0.5, 0, (bRect.points[1].z + bRect.points[2].z) * 0.5),
    new Vector3((bRect.points[2].x + bRect.points[3].x) * 0.5, 0, (bRect.points[2].z + bRect.points[3].z) * 0.5),
    new Vector3((bRect.points[3].x + bRect.points[0].x) * 0.5, 0, (bRect.points[3].z + bRect.points[0].z) * 0.5),
  ]; */

  let bbox_l, bbox_r;

  if (bRect.length > bRect.width) {
    bbox_l = [pts[0], pts[1], getAveragePoint([pts[1], pts[2]]), getAveragePoint([pts[3], pts[0]])];
    bbox_r = [getAveragePoint([pts[3], pts[0]]), getAveragePoint([pts[1], pts[2]]), pts[2], pts[3]];
    // var divVec = [bRect.midPts[1], bRect.midPts[3]]
  } else {
    bbox_l = [getAveragePoint([pts[0], pts[1]]), pts[1], pts[2], getAveragePoint([pts[2], pts[3]])];
    bbox_r = [pts[0], getAveragePoint([pts[0], pts[1]]), getAveragePoint([pts[2], pts[3]]), pts[3]];
    // var divVec = [bRect.midPts[0], bRect.midPts[2]]
  }

  // console.log('bbox_l:: ', bbox_l, bbox_r);

  const union_l = getIntersections(bbox_l, pList);
  const union_r = getIntersections(bbox_r, pList);

  // console.log('Using minimumAABB', { pList, union_l, union_r });

  return [...union_l, ...union_r];
}

/**divides the polygon into two parts by parallel or perpendicular line offseted from its center*/
export function halvePerpendicularByFactor(pList, flipSlice, factor) {
  let angle;

  if (flipSlice) {
    angle = 0;
  } else {
    angle = 90;
  }

  let bRect = getMinimumAABB(pList);
  let rotation;

  //to get slice always oriented in the same direction
  //if the rotation of the bounding box is smaller than 90 then lets create the rotated by 90 bounding box
  if (bRect.angle < 90) {
    rotation = bRect.angle + angle + 90;
    bRect = getBoundingRectangle(pList, rotation);
  } else {
    rotation = bRect.angle + angle;
    bRect = getBoundingRectangle(pList, rotation);
  }

  bRect.midPts = [
    pointOnLine(bRect.points[0], bRect.points[1], factor),
    pointOnLine(bRect.points[1], bRect.points[2], factor),
    pointOnLine(bRect.points[2], bRect.points[3], factor),
    pointOnLine(bRect.points[3], bRect.points[0], 1 - factor),
  ];

  let bbox_l = [bRect.points[0], bRect.points[1], bRect.midPts[1], bRect.midPts[3]];
  let bbox_r = [bRect.midPts[3], bRect.midPts[1], bRect.points[2], bRect.points[3]];

  const union_l = getIntersections(bbox_l, pList);
  const union_r = getIntersections(bbox_r, pList);

  return { polygons: [...union_l, ...union_r], sectionPosition: bRect.midPts[3], angle: rotation - 90 };
}

//Returns not overlapping edges of first polygon
export function getPolygonsSeparatedEdges(polygon1, polygon2) {
  let separatedEdges = [];

  let edges1 = getPolygonEdges(polygon1);
  let edges2 = getPolygonEdges(polygon2);

  let count1 = edges1.length;
  let count2 = edges2.length;
  for (let i = 0; i < count1; i++) {
    let edge1 = edges1[i];
    let equal = false;
    let overlap = false;
    for (let j = 0; j < count2; j++) {
      let edge2 = edges2[j];
      if (edgesAreEqual(edge1, edge2)) equal = true;
      //let's check also the case if the shorter edge lays on a longer one
      let p1 = edge1[0];
      let p2 = edge1[1];
      let is1 = pointLine(p1.x, p1.z, edge2[0].x, edge2[0].z, edge2[1].x, edge2[1].z, 0.01);
      let is2 = pointLine(p2.x, p2.z, edge2[0].x, edge2[0].z, edge2[1].x, edge2[1].z, 0.01);

      if (is1 && is2) overlap = true;
    }
    if (!equal && !overlap) separatedEdges.push(edge1);
  }
  return separatedEdges;
}
export function getPolygonEdges(polygon) {
  let edges = [];
  let count = polygon.length;

  for (let i = 0; i < count; i++) {
    if (i == count - 1) {
      edges.push([polygon[count - 1], polygon[0]]);
    } else {
      edges.push([polygon[i], polygon[i + 1]]);
    }
  }

  return edges;
}
//merge edges (2-element array of vector3's) to a array with non duplicating vertices
export function mergeEdgeSeriesToSinglePolyline(edges) {
  let polyline = [];
  let count = edges.length;

  let edge0 = edges[0];
  let a0 = edge0[0];
  let b0 = edge0[1];

  //first edge
  polyline.push(a0); //let's add start point as a first point

  //if there is only one edge, let's return it as a polyline
  if (count == 1) {
    polyline.push(b0);
    return polyline;
  }

  //all edges between the first and the last one
  for (let i = 1; i < count - 1; i++) {
    let edge1 = edges[i - 1];
    let b1 = edge1[1]; //end of first edge

    let edge2 = edges[i];
    let a2 = edge2[0]; //start of second edge

    if (vectorsAreEqual(a2, b1, 0.0001)) polyline.push(a2);
  }

  //the last edge
  let edgeLast = edges[count - 1];

  let aLast = edgeLast[0];
  let bLast = edgeLast[1];

  polyline.push(aLast);
  polyline.push(bLast);

  return polyline;
}
export function edgesAreEqual(edge1, edge2) {
  let a1 = edge1[0];
  let b1 = edge1[1];

  let a2 = edge2[0];
  let b2 = edge2[1];

  if (vectorsAreEqual(a1, a2, 0.01) && vectorsAreEqual(b1, b2, 0.01)) return true;
  return false;
}

// //checks the equality of two polygons composed as array of vector3
// export function polygonsAreEqual(polygon1, polygon2) {
//   // compare lengths - can save a lot of time
//   if (polygon1.length != polygon2.length) return false;

//   for (let i = 0; i < polygon1.length; i++) {
//     let vectorEquality = vectorsAreEqual(polygon1[i], polygon2[i]);
//     if (!vectorEquality) return false;
//   }

//   return true;
// }

//Checks the polygon equality, works for clockwise vs counterclockwise as well.
export function polygonsAreEqual(polygon1, polygon2, eps) {
  eps = eps || 0.000001;

  if (!(polygon1[0] instanceof Vector3)) polygon1 = polygon1.map((o) => new Vector3(o.x, o.y, o.z));
  if (!(polygon2[0] instanceof Vector3)) polygon2 = polygon2.map((o) => new Vector3(o.x, o.y, o.z));

  // compare lengths - can save a lot of time
  if (polygon1.length != polygon2.length) {
    return false;
  }

  for (let i = 0; i < polygon1.length; i++) {
    let isEqual = false;

    for (let j = 0; j < polygon2.length; j++) {
      let vectorEquality = vectorsAreEqual(polygon1[i], polygon2[i], eps);
      if (vectorEquality) isEqual = true;
    }

    if (!isEqual) return false;
  }

  //for weird cases let's add also the area check
  let area1 = getArea(polygon1);
  let area2 = getArea(polygon2);

  if (Math.abs(area1) - Math.abs(area2) >= eps) return false;

  return true;
}

/**returns a point on a single line (two points) using its length factor (0-1)*/
export function pointOnLine(p0, p1, factor) {
  if (!p0 || !p1) {
    return null;
  }

  let t = factor;

  let xt = (1 - t) * p0.x + t * p1.x;
  let zt = (1 - t) * p0.z + t * p1.z;

  let point = new Vector3(xt, 0, zt);

  return point;
}

//p1, p2 are the line points, point is the tested point
/**Returns bool, whether the projected point is actually inside the (finite) line segment. */
export function isPointOnLineSegment(p1, p2, point) {
  let L2 = (p2.x - p1.x) * (p2.x - p1.x) + (p2.z - p1.z) * (p2.z - p1.z);
  if (L2 == 0) return false;
  let r = ((point.x - p1.x) * (p2.x - p1.x) + (point.z - p1.z) * (p2.z - p1.z)) / L2;

  return 0 <= r && r <= 1;
}
export function distanceBetweenPointAndLine(p1, p2, point) {
  const lineDir = p2.clone().sub(p1).normalize();
  const p1ToPoint = point.clone().sub(p1);
  const cross = p1ToPoint.cross(lineDir);
  return cross.length() / lineDir.length();
}
/**Returns a projected point perpendicular on the (infinite) line, described by the line segment.*/
export function getNearestPointOnLine(p1, p2, point) {
  let L2 = (p2.x - p1.x) * (p2.x - p1.x) + (p2.z - p1.z) * (p2.z - p1.z);
  if (L2 == 0) return false;
  let r = ((point.x - p1.x) * (p2.x - p1.x) + (point.z - p1.z) * (p2.z - p1.z)) / L2;

  let x = p1.x + r * (p2.x - p1.x);
  let z = p1.z + r * (p2.z - p1.z);

  let projectedPoint = new Vector3(x, 0, z);

  return projectedPoint;
}
/**Returns random points inside a polygon*/
export function randomPtsInPolygon(polygon, nPts) {
  const bRect = getBoundingRectangle(polygon, 0);
  // console.log('bRect:: ', bRect)

  const points = randomPtsInBRect(bRect, nPts);

  // console.log('points:: ', points)
  const culled = [];

  points.forEach((pt) => {
    if (inside(pt, polygon)) culled.push(pt);
  });

  // console.log('culled:: ', culled)

  return culled;
}

/**Returns random points inside a bounding rectangle*/
function randomPtsInBRect(bRect, nPts) {
  let points = [];
  let refPt = bRect.points[0];

  for (var i = 0; i < nPts; i++) {
    const dx = random() * bRect.length + refPt.x;
    const dz = random() * bRect.width + refPt.z;

    points.push(new Vector3(dx, 0, dz));
  }

  return points;
}

//function for index wrapping
export function mod(x, m) {
  return ((x % m) + m) % m;
}

//Maps value from one range to another
export function mapRange(value, low1, high1, low2, high2) {
  return low2 + ((high2 - low2) * (value - low1)) / (high1 - low1);
}

//Finds median in array of numbers
export function median(numbers) {
  const sorted = numbers.slice().sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}

/**Finds intersection point for 2 line segments.*/
export function findSegmentIntersection(m1, m2, n1, n2) {
  let a1 = m2.z - m1.z;
  let b1 = m1.x - m2.x;
  let c1 = a1 * m1.x + b1 * m1.z;

  let a2 = n2.z - n1.z;
  let b2 = n1.x - n2.x;
  let c2 = a2 * n1.x + b2 * n1.z;

  let det = a1 * b2 - a2 * b1;

  if (det == 0) {
    //alert('Parallel');
    return null;
  } else {
    let x = (b2 * c1 - b1 * c2) / det;
    let z = (a1 * c2 - a2 * c1) / det;
    if (!x || !z) return null;
    return new Vector3(x, 0, z);
  }
}

export function raycastToPolygon(rayPos, dir, polygon) {
  const rayDir = rayPos.clone().add(dir);
  const intersections = [];
  const nSides = polygon.length;

  for (let i = 0; i < nSides; i++) {
    const pt1 = polygon[i];
    const pt2 = polygon[mod(i + 1, nSides)];
    const intersection = raycastToWall(rayPos, rayDir, pt1, pt2);
    if (intersection) intersections.push(intersection);
  }

  // console.log('Intersections are:: ', { intersections, rayPos, rayDir, polygon });

  if (intersections.length === 1) {
    return intersections[0];
  }

  if (intersections.length) {
    intersections.sort((a, b) => a.distanceTo(rayPos) - b.distanceTo(rayPos));
    return intersections[0];
  }
  return null;
}

export function checkRayWallIntersection(rayPos, rayDir, wallPt1, wallPt2) {
  const det = (rayDir.x - rayPos.x) * (wallPt2.z - wallPt1.z) - (wallPt2.x - wallPt1.x) * (rayDir.z - rayPos.z);
  if (det === 0) {
    return false;
  }
  const lambda =
    ((wallPt2.z - wallPt1.z) * (wallPt2.x - rayPos.x) + (wallPt1.x - wallPt2.x) * (wallPt2.z - rayPos.z)) / det;
  const gamma = ((rayPos.z - rayDir.z) * (wallPt2.x - rayPos.x) + (rayDir.x - rayPos.x) * (wallPt2.z - rayPos.z)) / det;
  return lambda > 0 && lambda < 1 && gamma > 0;
}

export function raycastToWall(rayPos, rayDir, wallPt1, wallPt2) {
  const ua_t = (wallPt2.x - wallPt1.x) * (rayPos.z - wallPt1.z) - (wallPt2.z - wallPt1.z) * (rayPos.x - wallPt1.x);
  const ub_t = (rayDir.x - rayPos.x) * (rayPos.z - wallPt1.z) - (rayDir.z - rayPos.z) * (rayPos.x - wallPt1.x);
  const u_b = (wallPt2.z - wallPt1.z) * (rayDir.x - rayPos.x) - (wallPt2.x - wallPt1.x) * (rayDir.z - rayPos.z);

  if (u_b !== 0) {
    const ua = ua_t / u_b;
    const ub = ub_t / u_b;

    if (0 <= ua /* && ua <= 1 */ && 0 <= ub && ub <= 1) {
      return new Vector3(rayPos.x + ua * (rayDir.x - rayPos.x), 0, rayPos.z + ua * (rayDir.z - rayPos.z));
    }
    return null; //("No Intersection");
  }
  if (ua_t === 0 || ub_t === 0) {
    return null; //("Coincident");
  }
  return null; //("Parallel");
}

export function extendLineToPolygon(p1, p2, polygon) {
  const dir1 = p2.clone().sub(p1).normalize();
  const dir2 = p1.clone().sub(p2).normalize();
  const intersect1 = raycastToPolygon(p1, dir1, polygon);
  const intersect2 = raycastToPolygon(p2, dir2, polygon);
  return [intersect1, intersect2];
}
/**Checks whether 2 line segments intersect*/
export function checkSegmentIntersection(a1, a2, b1, b2) {
  const det = (a2.x - a1.x) * (b2.z - b1.z) - (b2.x - b1.x) * (a2.z - a1.z);
  if (det === 0) {
    return false;
  }
  const lambda = ((b2.z - b1.z) * (b2.x - a1.x) + (b1.x - b2.x) * (b2.z - a1.z)) / det;
  const gamma = ((a1.z - a2.z) * (b2.x - a1.x) + (a2.x - a1.x) * (b2.z - a1.z)) / det;
  return 0 < lambda && lambda < 1 && 0 < gamma && gamma < 1;
}

export function intersectLineLine(a1, a2, b1, b2) {
  const ua_t = (b2.x - b1.x) * (a1.z - b1.z) - (b2.z - b1.z) * (a1.x - b1.x);
  const ub_t = (a2.x - a1.x) * (a1.z - b1.z) - (a2.z - a1.z) * (a1.x - b1.x);
  const u_b = (b2.z - b1.z) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.z - a1.z);

  if (u_b !== 0) {
    const ua = ua_t / u_b;
    const ub = ub_t / u_b;

    if (0 <= ua && ua <= 1 && 0 <= ub && ub <= 1) {
      return new Vector3(a1.x + ua * (a2.x - a1.x), 0, a1.z + ua * (a2.z - a1.z));
    }
    return null; //("No Intersection");
  }
  if (ua_t === 0 || ub_t === 0) {
    return null; //("Coincident");
  }
  return null; //("Parallel");
}

export function intersectLinePolygon(a1, a2, points) {
  var result = [];
  var length = points.length;

  for (var i = 0; i < length; i++) {
    var b1 = points[i];
    var b2 = points[(i + 1) % length];
    var inter = intersectLineLine(a1, a2, b1, b2);

    if (inter != null) result.push(inter);
  }

  return result;
}

function scaleSegment(p1, p2, fac) {
  let a = p1.x;
  let b = p1.z;
  let c = p2.x;
  let d = p2.z;

  let x = fac * c + (1 - fac) * a;
  let z = fac * d + (1 - fac) * b;

  return [p1, new Vector3(x, 0, z)];
}
/**bounding box for volume graph */
export function getBoundingBox({ points }) {
  let max = [...points[0]];
  let min = [...points[0]];

  points.forEach((o) => {
    for (var i = 0; i < o.length; i++) {
      if (max[i] < o[i]) {
        max[i] = o[i];
      }
      if (min[i] > o[i]) {
        min[i] = o[i];
      }
    }
  });

  return { max, min };
}

/**Returns a bounding rectangle for a set of points*/
export function getBoundingRectangle(pts, angle) {
  if (!pts.length) return null;
  let midPt = getAveragePoint(pts);

  let rotPts = rotatePoint2D(pts, angle, midPt);

  // pts = [...rotPts];

  const Xs = rotPts.map((pt) => pt.x);
  const Zs = rotPts.map((pt) => pt.z);

  const minX = Math.min(...Xs);
  const maxX = Math.max(...Xs);
  const minZ = Math.min(...Zs);
  const maxZ = Math.max(...Zs);

  let rectangle = [
    new Vector3(minX, 0, minZ),
    new Vector3(minX, 0, maxZ),
    new Vector3(maxX, 0, maxZ),
    new Vector3(maxX, 0, minZ),
  ];

  let boundingPts = rotatePoint2D(rectangle, -angle, midPt);
  // boundingPts = [...tempBndPt];

  let bRect = {
    points: boundingPts,
    length: abs(maxX - minX),
    width: abs(maxZ - minZ),
    area: function () {
      return this.length * this.width;
    },
    angle,
  };
  bRect.axis = bRect.points[1].clone().sub(bRect.points[0]).normalize();
  // const aabbAxis = new Vector3(1, 0, 0);
  // bRect.axis = rotateVector2D(aabbAxis, ang);

  return bRect;
}

export function evaluateBBOX(bbox, u, v) {
  const origin = bbox.points[0],
    a = bbox.points[1],
    b = bbox.points[3];
  const uVec = lerp(origin, a, u).sub(origin);
  const vVec = lerp(origin, b, v).sub(origin);

  return origin.clone().add(uVec).add(vVec);
}

export function lerp(a, b, fac) {
  return b.clone().sub(a).multiplyScalar(fac).add(a);
}

export function getArrayInRange(start, end) {
  return Array(end - start + 1)
    .fill()
    .map((_, idx) => start + idx);
}

export function getCenterOfMass(pList) {
  const closed = pList.map((v) => [v.x, v.z]);
  closed.push(closed[0]);

  const polygon = turf.polygon([closed]);
  const com = turf.centerOfMass(polygon).geometry.coordinates;
  return new Vector3(com[0], 0, com[1]);
}

export function getCenter(pList) {
  const closed = pList.map((v) => [v.x, v.z]);
  // closed.push(closed[0]);
  const polygon = turf.polygon([closed]);
  const com = turf.center(polygon).geometry.coordinates;
  return new Vector3(com[0], 0, com[1]);
}

export function getCenterPoly(pList) {
  const closed = pList.map((v) => [v[0], v[1]]);
  // closed.push(closed[0]);
  const polygon = turf.polygon([closed]);
  const com = turf.center(polygon).geometry.coordinates;
  return com;
}

/** pList is an array of Vector3. Returns center of the polygon */
export function getCenterPolyVector(pList) {
  const closed = pList.map((v) => {
    return [v.x, v.z];
  });
  closed.push(closed[0]);
  // closed.push(closed[0]);
  const polygon = turf.polygon([closed]);
  const com = turf.center(polygon).geometry.coordinates;
  const center = new Vector3(com[0], 0, com[1]);
  return center;
  // return com;
}
/**Returns average point between multiple points*/
export function getAveragePoint(pList) {
  const listLen = pList.length;
  let sumX = 0,
    sumY = 0,
    sumZ = 0;

  for (let i = 0; i < pList.length; i++) {
    const element = pList[i];
    sumX += element.x;
    sumY += element.y;
    sumZ += element.z;
  }

  const avgX = sumX / listLen;
  const avgY = sumY / listLen;
  const avgZ = sumZ / listLen;

  return new Vector3(avgX, avgY, avgZ);
}

/**
 * Improved minBBOX
 * Get minimum bounding rectangle for a set of points*/
export function getMinimumAABB(points) {
  const range = [
    { angle: 0, aabb: getBoundingRectangle(points, 0) },
    { angle: 179, aabb: getBoundingRectangle(points, 179) },
  ];

  for (let i = 0; i < 10; i++) {
    const diff = Math.abs(range[0].angle - range[1].angle);
    //if diff between angles is within tolerance, breaks loop
    // console.log('Bounding rect i:: ', diff);
    if (diff < 1) {
      break;
    }
    if (range[0].aabb.area() <= range[1].aabb.area()) {
      range[1].angle = (range[0].angle + range[1].angle) / 2;
      range[1].aabb = getBoundingRectangle(points, range[1].angle);
      continue;
    }
    range[0].angle = (range[0].angle + range[1].angle) / 2;
    range[0].aabb = getBoundingRectangle(points, range[0].angle);
  }

  const minBBOX = range[0].aabb.area() < range[1].aabb.area() ? range[0].aabb : range[1].aabb;
  return minBBOX;
}

/**Get minimum bounding rectangle for a set of points*/
/* export function getMinimumAABB(pList) {
  let bAreas = [];
  const step = 5;
  let bRect;

  for (let i = 0; i < 90; i += step) {
    bRect = getBoundingRectangle(pList, i);

    if (!bRect) {
      continue;
    }

    bAreas.push(bRect.area());
  }

  if (!bAreas.length) {
    return null;
  }

  const index = bAreas.indexOf(min(...bAreas));
  bRect = getBoundingRectangle(pList, index * step);
  bRect.angle = index * step;

  return bRect;
} */

export function rotatePoint2D(pts, ang, anchor) {
  if (!pts) return null;
  const single = pts.length > 0 ? false : true;
  pts = single ? [pts] : pts;
  let rotPts = [];

  pts.forEach((pt) => {
    let oVec = getVectorFromPoints(anchor, pt);
    let rotVec = rotateVector2D(oVec, ang);
    let newVec = new Vector3(anchor.x + rotVec.x, anchor.y + rotVec.y, anchor.z + rotVec.z);
    rotPts.push(newVec);
  });
  return single ? rotPts[0] : rotPts;
}

export function getVectorFromPoints(p1, p2, normalize) {
  let nx = p2.x - p1.x;
  let ny = p2.y - p1.y;
  let nz = p2.z - p1.z;

  if (normalize) {
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
    nx /= len;
    ny /= len;
    nz /= len;
  }

  return new Vector3(nx, ny, nz);
}

export function rotateVector2D(v, ang, isRadians) {
  ang = isRadians ? ang : rad(ang);

  const x = v.x * cos(ang) - v.z * sin(ang);
  const z = v.x * sin(ang) + v.z * cos(ang);

  return new Vector3(x, v.y, z);
}

export function rad(degrees) {
  return degrees * (PI / 180);
}

export function degrees(rad) {
  return rad * (180 / PI);
}

export function getArea(pList) {
  if (pList == null) return 0;
  return abs(shoelace(pList) / 2);
}

export function getFootprintArea(shape, holes) {
  //assumption: holes are completely inside the shape and they do not overlap
  let area = getArea(shape);
  holes.forEach((hole) => (area -= getArea(hole)));
  return area;
}

function shoelace(pts) {
  const len = pts.length;
  let sum = 0;
  let a = 0,
    b = 0,
    c = 0;

  for (var i = 0; i < len; i++) {
    a = pts[mod(i, len)].x + pts[mod(i + 1, len)].x;
    b = pts[mod(i + 1, len)].z - pts[mod(i, len)].z;
    c = a * b;
    sum += c;
  }

  return sum;
}

export function perimeter(pList) {
  let perimeter = 0;
  let len = pList.length;

  if (pList == null) return perimeter;
  else {
    for (var i = 0; i < len; i++) {
      const p1 = pList[i];
      const p2 = pList[(i + 1) % len];

      const dx2 = pow(p2.x - p1.x, 2);
      const dz2 = pow(p2.z - p1.z, 2);

      perimeter += sqrt(dx2 + dz2);
    }

    return perimeter;
  }
}

export function Percent(value, total) {
  return Math.round((value * 100) / total);
}

export function sum(list) {
  return list.reduce((a, b) => a + b, 0);
}

export function checkPolygonInsidePolygon(polygon, bounds) {
  let isInside = true;

  for (const pt of polygon) {
    isInside = inside(pt, bounds);

    if (!isInside) {
      return false;
    }
  }

  return true;
}

export function getPointFromNormal({ dir, dist }) {
  const position = new Vector3();
  const normal = getNormalToVector(dir);
  position.add(normal.multiplyScalar(dist));
  return position;
}

export function getPointInDirection({ dir, dist }) {
  const position = new Vector3();
  position.add(dir.clone().normalize().multiplyScalar(dist));
  return position;
}

export function getRandomPointInsidePolygon({ polygon, holes, u, v, maxTries, bbox }) {
  //define max iterations
  maxTries = maxTries === undefined ? 10 : maxTries;
  //if max iterations reached, return null
  if (maxTries === 0) return null;
  //u, v can be defined, else will be random
  u = u || Math.random();
  v = v || Math.random();
  //bbox can be defined, else minimum taken
  bbox = bbox || getMinimumAABB(polygon);

  const pt = evaluateBBOX(bbox, u, v);

  let inHole = false;

  if (holes?.length) {
    for (const hole of holes) {
      inHole = inside(pt, hole);
      if (inHole) return getRandomPointInsidePolygon({ polygon, holes, maxTries, bbox });
    }
  }

  if (inside(pt, polygon)) {
    return pt;
  }
  maxTries -= 1;
  //if given uvs dont work, it will try again with random uvs
  return getRandomPointInsidePolygon({ polygon, maxTries, bbox });
}

export function inside(point, vs) {
  var x = point.x,
    y = point.z;

  let bool = false;

  for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    var xi = vs[i].x,
      yi = vs[i].z;
    var xj = vs[j].x,
      yj = vs[j].z;

    var intersect = yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) bool = !bool;
  }

  return bool;
}

export function thickenLine(line, thickness) {
  const normal = lineNormal(line[0], line[1]);

  const positive = normal.clone().multiplyScalar(thickness / 2);
  const negative = normal.clone().multiplyScalar(-thickness / 2);

  const p1 = line[0].clone().add(positive);
  const p2 = line[1].clone().add(positive);
  const p3 = line[1].clone().add(negative);
  const p4 = line[0].clone().add(negative);

  return [p1, p2, p3, p4];
}

export function lineNormal(p1, p2) {
  const len = distance(p1, p2);
  let nx = (p2.x - p1.x) / len;
  let ny = (p2.y - p1.y) / len;
  let nz = (p2.z - p1.z) / len;
  return new Vector3(nz, ny, -nx);
}

export function getNormalToVector(v) {
  const normal = new Vector3(v.z, v.y, -v.x);
  return normal.normalize();
}

export function distance(p1, p2) {
  const nx = p2.x - p1.x;
  const ny = p2.y - p1.y;
  const nz = p2.z - p1.z;
  return sqrt(nx * nx + ny * ny + nz * nz);
}

export function dotProduct(v1, v2) {
  return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
}

export function angleBetweenVectors(v1, v2) {
  //find angle between 2 lines
  const ll1 = sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
  const ll2 = sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);
  const value = dotProduct(v1, v2) / (ll1 * ll2);

  return acos(value);
}

export function angleToLineSegments(a1, b1, a2, b2) {
  let dx0 = b1.x - a1.x;
  let dy0 = b1.z - a1.z;
  let dx1 = b2.x - a2.x;
  let dy1 = b2.z - a2.z;

  let angle = Math.atan2(dx0 * dy1 - dx1 * dy0, dx0 * dx1 + dy0 * dy1);

  return angle;
}

export function angleBetweenVectorAndXaxis(v1) {
  return angleBetweenVectors(v1, new Vector3(1, 0, 0));
}

export function getVectorBetweenPoints(p1, p2) {
  return new Vector3(p2.x - p1.x, p2.y - p1.y, p2.z - p1.z);
}

export function getVectorFromLine(line) {
  return line[1].clone().sub(line[0]);
}

//Returns array of unique vertices (vector3s) by removing existing duplicates
export function getUniqueVerticesFromArray(vertices, epsilon) {
  let uniques = [];

  for (let i = 0; i < vertices.length; i++) {
    let add = true;
    for (let j = 0; j < uniques.length; j++) {
      if (vectorsAreEqual(vertices[i], uniques[j], epsilon)) {
        add = false;
        break;
      }
    }

    if (add) {
      uniques.push(vertices[i]);
    }
  }
  return uniques;
}

export function cleanClosedPolygon(points, tolerance) {
  // function to remove points which are causing small segments
  if (!tolerance) {
    tolerance = 0.5;
  }
  const segments = [];
  for (let i = 0; i < points.length - 1; i++) {
    const pair = [points[i], points[i + 1]];
    segments.push(pair);
  }
  // check length of segment
  const filteredSegments = segments.filter((segment) => {
    let dist = segment[0].distanceTo(segment[1]);
    if (dist < tolerance) {
      return false;
    }
    return true;
  });
  const filteredPoints = [];
  filteredPoints.push(segments[0][0]);
  for (const segment of filteredSegments) {
    filteredPoints.push(segment[1]);
  }
  return filteredPoints;
}

//checks the two vectors3 equality with epsilon to counter float number inaccuracy
export function vectorsAreEqual(v1, v2, epsilon) {
  epsilon = epsilon || 0.00000001;
  let areEqual = Math.abs(v2.x - v1.x) < epsilon && Math.abs(v2.y - v1.y) < epsilon && Math.abs(v2.z - v1.z) < epsilon;
  return areEqual;
}

export function getTwoOppositePointsInRange({ min, max, minPercentage, maxPercentage }) {
  let pt1 = {},
    pt2 = {};
  const minRange = minPercentage || 0.25;
  const maxRange = maxPercentage || 0.75;

  const minVal = max * minRange;
  const maxVal = max * maxRange;

  const value = randomInteger([0, 3]);

  switch (value) {
    case 0:
      pt1 = { u: randomInRange([min, max]), v: randomInRange([min, minVal]) };
      pt2 = { u: randomInRange([min, max]), v: randomInRange([maxVal, max]) };
      break;
    case 1:
      pt1 = { u: randomInRange([min, max]), v: randomInRange([maxVal, max]) };
      pt2 = { u: randomInRange([min, max]), v: randomInRange([min, minVal]) };
      break;
    case 2:
      pt1 = { u: randomInRange([min, minVal]), v: randomInRange([min, max]) };
      pt2 = { u: randomInRange([maxVal, max]), v: randomInRange([min, max]) };
      break;
    case 3:
      pt1 = { u: randomInRange([maxVal, max]), v: randomInRange([min, max]) };
      pt2 = { u: randomInRange([min, minVal]), v: randomInRange([min, max]) };
      break;
    default:
      break;
  }
  return [pt1, pt2];
}

export function randomIndex(length) {
  return Math.round(Math.random() * (length - 1));
}

export function selectRandom(collection) {
  const index = randomIndex(collection.length);
  return collection[index];
}

export function randomInteger(range) {
  const span = range[1] - range[0];
  const jump = round(random() * span);
  return jump + range[0];
}

export function randomInRange(range) {
  const span = range[1] - range[0];
  const jump = random() * span;
  return jump + range[0];
}

export function randomSteps(count, sorted) {
  const values = [];
  for (var i = 0; i < count; i++) {
    values.push(random());
  }
  if (sorted) values.sort((a, b) => a - b);
  return values;
}

export function randomDistribution(count, sorted) {
  const values = [];
  for (var i = 0; i < count; i++) {
    values.push(random());
  }
  const total = sum(values);
  const distribution = values.map((value) => value / total);
  if (sorted) distribution.sort((a, b) => a - b);
  return distribution;
}

export function proportionateDistribution({ amount, ratio, increment, isInteger, nonZero }) {
  const distribution = [];
  ratio.forEach((r) => distribution.push(r * amount));

  if (isInteger) {
    const rounding = nonZero ? ceil : round;
    distribution.forEach((d) => (d = rounding(d)));
  }

  const total = sum(distribution);

  if (total > amount) {
    const diff = total - amount;
    distribution.sort((a, b) => b - a);

    for (var i = 0; i < diff; i += increment) {
      if (distribution[i] <= increment) {
        continue;
      }
      distribution[i] -= i;
      if (sum(distribution) <= amount) {
        break;
      }
    }
  }

  return distribution;
}

export function createRectangle(l, w, angle) {
  const v1 = new Vector3(-l / 2, 0, w / 2);
  const v2 = new Vector3(l / 2, 0, w / 2);
  const v3 = new Vector3(l / 2, 0, -w / 2);
  const v4 = new Vector3(-l / 2, 0, -w / 2);

  let rectangle = [v1, v2, v3, v4];

  if (angle) return rotatePoint2D(rectangle, angle, new Vector3());

  return rectangle;
}

export function fitWithinBounds({ value, min, max }) {
  if (value < min) value = min;
  if (value > max) value = max;
  return value;
}

export function isClockWise(polygon) {
  return shoelace(polygon) < 0 ? true : false;
}

export function makeClockwise(polygon) {
  const clockwise = isClockWise(polygon);
  if (!clockwise) polygon.reverse();
  return polygon;
}

export function makeAntiClockwise(polygon) {
  const clockwise = isClockWise(polygon);
  if (clockwise) polygon.reverse();
  return polygon;
}

export function cullEmpties(list) {
  const culled = [];

  for (const item of list) {
    if (item === null || item === undefined) {
      continue;
    }
    culled.push(item);
  }

  return culled;
}

export function aliasWithRandomDeletions(polygon, boundary, dim, angle, cullPercentage) {
  const aliased = gridInPolygon({ polygon: boundary, angle, x: dim, y: dim, grade: true });
  for (const cell of aliased) {
    cell.points.forEach((v) => {
      if (!inside(v, polygon)) cell.grade = -1;
    });
  }
  const contained = aliased.filter((cell) => cell.grade !== -1).map((c) => c.points);

  let culled = contained.filter((cell) => Math.random() > cullPercentage);
  if (!culled.length) culled = contained;
  return getUnion(culled);
}
export function aliasWithOuterDeletions(polygon, boundary, dim, angle, cullPercentage) {
  const aliased = gridInPolygon({ polygon: boundary, angle, x: dim, y: dim, grade: true });
  for (const cell of aliased) {
    cell.points.forEach((v) => {
      if (!inside(v, polygon)) cell.grade = -1;
    });
  }
  let contained = aliased.filter((cell) => cell.grade !== -1);
  contained.sort((a, b) => a.grade - b.grade);
  contained = removePercent(contained, cullPercentage, 0.4);
  let culled = contained;
  culled = culled.map((cell) => cell.points);
  if (!culled.length) culled = contained.map((cell) => cell.points);
  const unions = getUnions(culled);
  let largestUnion;
  let maxArea = 0;
  for (const union of unions) {
    const area = getArea(union);
    if (area > maxArea) {
      largestUnion = union;
      maxArea = area;
    }
  }
  return largestUnion;
}

export function aliasPolygonWithReferenceBoundary(polygon, boundary, dim, angle) {
  const aliased = gridInPolygon({ polygon: boundary, angle, x: dim, y: dim });
  for (const cell of aliased) {
    cell.points.forEach((v) => {
      if (!inside(v, polygon)) cell.grade = -1;
    });
  }
  return getUnion(aliased.filter((cell) => cell.grade !== -1).map((c) => c.points));
}

export function aliasPolygon(polygon, dim, angle) {
  const aliased = gridInPolygon({ polygon, angle, x: dim, y: dim });
  return getUnion(aliased.map((c) => c.points));
}

export function gridInPolygon({ polygon, angle, x, y, grade }) {
  if (!polygon || !polygon.length) {
    return null;
  }

  let cells = [];

  const bRect = getBoundingRectangle(polygon, angle);
  const o = bRect.points[0],
    ptX = bRect.points[1],
    ptY = bRect.points[3];
  const vX = getVectorFromPoints(o, ptX, true),
    vY = getVectorFromPoints(o, ptY, true);
  const lenX = distance(o, ptX),
    lenY = distance(o, ptY);
  const nX = floor(lenX / x),
    nY = floor(lenY / y);

  const xx = vX.x * x,
    xz = vX.z * x;
  const zx = vY.x * y,
    zz = vY.z * y;

  for (var i = 0; i < nX; i++) {
    for (var j = 0; j < nY; j++) {
      let pt1 = new Vector3(o.x + xx * i + zx * j, o.y, o.z + xz * i + zz * j);
      let pt2 = new Vector3(o.x + xx * (i + 1) + zx * j, o.y, o.z + xz * (i + 1) + zz * j);
      let pt3 = new Vector3(o.x + xx * (i + 1) + zx * (j + 1), o.y, o.z + xz * (i + 1) + zz * (j + 1));
      let pt4 = new Vector3(o.x + xx * i + zx * (j + 1), o.y, o.z + xz * i + zz * (j + 1));

      cells.push({ points: [pt1, pt2, pt3, pt4], grade: 0 });
    }
  }

  cells.forEach((cell) => {
    cell.points = makeAntiClockwise(cell.points);
    cell.points.forEach((v) => {
      if (!inside(v, polygon)) cell.grade = -1;
    });
  });

  if (grade) {
    const branched = branchList(cells, nY);
    cells = gradeCellsInGrid(branched).flat();
  }
  return cells.filter((cell) => cell.grade !== -1);
}

function branchList(list, num) {
  const branched = [];
  let branch = [];

  for (var i = 0; i < list.length; i++) {
    branch.push(list[i]);

    if (i % num == num - 1 || i == list.length - 1) {
      branched.push(branch);
      branch = [];
    }
  }

  return branched;
}

function gradeCellsInGrid(branchedGrid) {
  // console.log( "branchedGrid:: ", branchedGrid )
  let insideness_arr = [...branchedGrid];
  const n_rows = branchedGrid.length;
  const n_cols = branchedGrid[0].length;

  for (var i = 0; i < n_rows; i++) {
    for (var j = 0; j < n_cols; j++) {
      if (branchedGrid[i][j].grade != -1) {
        let in_col = check_col(branchedGrid, i, j);
        let in_row = check_row(branchedGrid, i, j);
        let in_risingD = check_risingDiagonal(branchedGrid, i, j);
        let in_fallingD = check_fallingDiagonal(branchedGrid, i, j);
        branchedGrid[i][j].grade = (in_col + in_row + in_risingD + in_fallingD) / (n_rows * n_cols);
      }
    }
  }

  return branchedGrid;

  function check_col(cells, curr_row, curr_col) {
    let col_before = 0.5,
      col_after = 0.5;

    for (var k = 0; k < n_rows; k++) {
      if (cells[k][curr_col].grade != -1 && k < curr_row) {
        col_before++;
      }

      if (cells[k][curr_col].grade != -1 && k > curr_row) {
        col_after++;
      }
    }

    return col_before * col_after;
  }

  function check_row(cells, curr_row, curr_col) {
    let row_before = 0.5,
      row_after = 0.5;

    for (var k = 0; k < n_cols; k++) {
      if (cells[curr_row][k].grade != -1 && k < curr_col) {
        row_before++;
      }

      if (cells[curr_row][k].grade != -1 && k > curr_col) {
        row_after++;
      }
    }

    return row_before * row_after;
  }

  function check_risingDiagonal(cells, curr_row, curr_col) {
    let diag_before = 0.5,
      diag_after = 0.5;

    let i_row = curr_row - 1;
    let i_col = curr_col + 1;

    while (i_row >= 0 && i_col < n_cols) {
      if (cells[i_row][i_col].grade != -1) diag_before++;
      i_row--;
      i_col++;
    }

    i_row = curr_row + 1;
    i_col = curr_col - 1;

    while (i_row < n_rows && i_col >= 0 && i_col < n_cols) {
      if (cells[i_row][i_col].grade != -1) diag_after++;
      i_row++;
      i_col++;
    }

    return diag_before * diag_after;
  }

  function check_fallingDiagonal(cells, curr_row, curr_col) {
    let diag_before = 0.5,
      diag_after = 0.5;

    let i_row = curr_row - 1;
    let i_col = curr_col - 1;

    while (i_row >= 0 && i_col >= 0) {
      if (cells[i_row][i_col].grade != -1) diag_before++;
      i_row--;
      i_col--;
    }

    i_row = curr_row + 1;
    i_col = curr_col + 1;

    while (i_row < n_rows && i_col >= 0 && i_col < n_cols) {
      if (cells[i_row][i_col].grade != -1) diag_after++;
      i_row++;
      i_col--;
    }

    return diag_before * diag_after;
  }
}

function removePercent(array, percent, available) {
  let elementsToRemove = Math.max(1, Math.floor(array.length * percent)); // minimally removes 1 cell
  while (elementsToRemove) {
    let randomIndex = Math.floor(Math.random() * Math.floor(array.length * available));
    array.splice(randomIndex, 1);
    elementsToRemove--;
  }
  return array;
}

export function getAccurateCenterOfPolygon(polygon) {
  const poly = polygon.map((pt) => [pt.x, pt.z]);
  const center = polylabel([poly], 1.0);

  return new Vector3(center[0], 0, center[1]);
}

export function sortPointsAntiClockwise(points) {
  let center = getAccurateCenterOfPolygon(points);

  // Add an angle property to each point using tan(angle) = y/x
  const angles = points.map((point) => {
    point.angle = (Math.atan2(point.z - center.z, point.x - center.x) * 180) / Math.PI;
    return point;
  });

  // Sort your points by angle clockwise
  const pointsSorted = angles.sort((a, b) => a.angle - b.angle);

  // and reverse the order
  pointsSorted.reverse();

  return pointsSorted;
}

export function getClosestPointInPointCloud(pt, cloud) {
  cloud.forEach((c) => (c.dist = distance(c, pt)));
  const sorted = cloud.map((c) => c).sort((a, b) => a.dist - b.dist);

  return sorted[0];
}

/**
 * @param buffer - buffer is the minimum distance required between point and any edge of the given polygon
 */
export function placePointinPolygonWithBuffer(pt, polygon, buffer) {
  //check if buffer condition is satisfied
  if (checkPointInPolygonBuffer(pt, polygon, buffer)) {
    return pt;
  }
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i],
      b = polygon[mod(i + 1, polygon.length)];
    const closestPt = findClosestPointOnEdge(pt, [a, b]);
    const distance = pt.distanceTo(closestPt);
    if (distance < buffer) {
      const dir = pt.clone().sub(closestPt).normalize();
      pt.add(dir.multiplyScalar(buffer - distance));
    }
  }

  return pt;
}

/**
 * Performs the even-odd-rule Algorithm (a raycasting algorithm) to find out whether a point is in a given polygon.
 * This runs in O(n) where n is the number of edges of the polygon.
 * @param {Array} polygon an array representation of the polygon where polygon[i][0] is the x Value of the i-th point and polygon[i][1] is the y Value.
 * @param {Array} point   an array representation of the point where point[0] is its x Value and point[1] is its y Value
 * @return {boolean} whether the point is in the polygon (not on the edge, just turn < into <= and > into >= for that)
 */
export function checkPointInPolygon(pt, polygon) {
  //A point is in a polygon if a line from the point to infinity crosses the polygon an odd number of times
  let odd = false;
  //For each edge (In this case for each point of the polygon and the previous one)
  for (let i = 0, j = polygon.length - 1; i < polygon.length; i++) {
    //If a line from the point into infinity crosses this edge
    if (
      polygon[i].z > pt.z !== polygon[j].z > pt.z && // One pt needs to be above, one below our y coordinate
      // ...and the edge doesn't cross our Y corrdinate before our x coordinate (but between our x coordinate and infinity)
      pt.x < ((polygon[j].x - polygon[i].x) * (pt.z - polygon[i].z)) / (polygon[j].z - polygon[i].z) + polygon[i].x
    ) {
      // Invert odd
      odd = !odd;
    }
    j = i;
  }
  //If the number of crossings was odd, the point is in the polygon
  return odd;
}

export function checkPointInPolygonBuffer(pt, polygon, buffer) {
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i],
      b = polygon[mod(i + 1, polygon.length)];
    const closestPt = findClosestPointOnEdge(pt, [a, b]);
    const distance = pt.distanceTo(closestPt);
    if (distance < buffer) {
      return false;
    }
  }
  return true;
}

export function closestPointOnPolygon(pt, polygon) {
  const edges = polygon.map((pt, i) => [pt, polygon[(i + 1) % polygon.length]]);
  const closests = edges.map((edge) => findClosestPointOnEdge(pt, edge));
  closests.sort((a, b) => pt.distanceTo(a) - pt.distanceTo(b));

  return closests[0];
}

export function findClosestPointOnEdge(pt, line) {
  const a = line[0],
    b = line[1];
  const m = b.clone().sub(a);
  const k = pt.clone().sub(a);

  const t = dotProduct(m, k) / dotProduct(m, m);

  if (t < 0) {
    return a.clone();
  }
  if (t > 1) {
    return b.clone();
  }

  return m.clone().multiplyScalar(t).add(a);
}
export function angleBetweenVectorsAnticlockwise(v1, v2) {
  return Math.PI * 2 - Math.atan2(v1.x * v2.z - v2.x * v1.z, v1.x * v2.x + v1.z * v2.z);
}

export function getRandomEdgeOfPolygon(polygon) {
  const i = randomIndex(polygon.length);
  return [polygon[i], polygon[mod(i + 1, polygon.length)]];
}

export function getLongestEdgeOfPolygon(polygon) {
  let edge = [],
    dist = 0;
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i],
      b = polygon[mod(i + 1, polygon.length)];
    const length = a.distanceTo(b);
    if (length > dist) {
      dist = length;
      edge = [a, b];
    }
  }
  return edge;
}
export function getLongestEdgeAndIndexOfPolygon(polygon) {
  let edge = [],
    dist = 0;
  let index = 0;
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i],
      b = polygon[mod(i + 1, polygon.length)];
    const length = a.distanceTo(b);
    if (length > dist) {
      dist = length;
      edge = [a, b];
      index = i;
    }
  }
  return { edge, index };
}
//
class GaussianRandom {
  constructor() {
    this.x1 = null;
    this.x2 = null;
    this.y1 = null;
    this.y2 = null;
    this.w = 1;
  }

  get(mean, sd) {
    if (this.y2) {
      //   console.log("Got Y2");
      this.y1 = this.y2;
      this.y2 = null;
      this.w = 1;
    } else {
      //   console.log("No Y2");
      while (this.w >= 1) {
        this.x1 = Math.random() * 2 - 1;
        this.x2 = Math.random() * 2 - 1;

        this.w = this.x1 * this.x1 + this.x2 * this.x2;
      }

      this.w = Math.sqrt((-2 * Math.log(this.w)) / this.w);
      this.y1 = this.x1 * this.w;
      this.y2 = this.x2 * this.w;
    }

    return this.y1 * sd + mean;
  }
}

export const gaussianRandom = new GaussianRandom();

export function getWrappedGaussianRandom(mean, sd) {
  return gaussianRandom.get(mean, sd) % 1;
}

export function runSimpleGA({ nPopulation, nGenerations, fFitness, fCopy, fGenerate, fMutate, fCrossover, props }) {
  //create initial population
  let population = getInitGeneration({ nPopulation, fGenerate });
  //sort population
  getFitnessAndSort({ population, fFitness, props });

  for (let i = 0; i < nGenerations; i++) {
    //create next generation
    population = getNextGeneration({ population, nPopulation, fMutate, fCrossover, fCopy });
    //measure fitness and sort
    getFitnessAndSort({ population, fFitness, props });
  }

  return population[0];
}

function getFitnessAndSort({ population, fFitness, props }) {
  population.forEach((s) => (s.fitness = fFitness(s, props)));
  //the closer the fitness to 0, the better the solution
  population.sort((a, b) => a.fitness - b.fitness);
  const fitnessSum = sum(population.map((s) => s.fitness));
  // console.log('Fitness sum:: ', fitnessSum);
  population.forEach((s) => (s.fitness /= fitnessSum));
}

function getInitGeneration({ nPopulation, fGenerate }) {
  const population = [];
  for (let i = 0; i < nPopulation; i++) {
    const specimen = fGenerate();
    population.push(specimen);
  }
  // console.log('population::', population);
  return population;
}

//ZQ:: change mutation rate
function getNextGeneration({ population, nPopulation, fMutate, fCrossover, fCopy }) {
  const generation = [];
  //flip normalized fitness such that specimen with best fitness has higher probability of getting picked
  const probabilities = population.map((s) => 1 - s.fitness);

  for (let i = 0; i < nPopulation; i++) {
    //need for deepcopy?
    let specimenA = pickSpecimen(population, probabilities);
    // let specimenB = pickSpecimen(population);
    //add crossover function here to mix specimenA & specimenB
    const specimen = fCopy(specimenA);
    mutateSpecimen(specimen, fMutate, 0.6);
    generation.push(specimen);
  }

  return generation;
}

function pickSpecimen(population, probabilities) {
  let index = -1,
    prob = Math.random();
  while (prob > 0) {
    index++;
    prob -= probabilities[index];
  }
  return population[index];
}

function mutateSpecimen(specimen, fMutate, mutationRate) {
  if (Math.random() > mutationRate) return specimen;
  return fMutate(specimen);
}

function fitRectanglesIntoPolygon({ count, polygon }) {
  /* 
  1. 
   */
}

function simplyfyPolygon({ polygon, nCounts }) {
  /* 
  1. run clean polygon function
  2. straigthen lines with negligible bend
  3. remove fillets, chamfer
  4. reach target number of points with minimal shape diviation
   */
}

function cleanPolygon({ polygon, threshold }) {
  /* 
  1. find consecutuve point that are closer than threshold
  2. extend them such that overall shape is maintained
  3. or merge them 
  4. remove colinear points
   */
}

function parcelPolygon({ polygon, count }) {
  /* 
  1. 
   */
}

function growShapeInPolygon({ rules, polygon }) {
  /* 
  1. 
   */
}

export function findInRanges(val, lengths) {
  let sum = 0;
  for (let i = 0; i < lengths.length; i++) {
    sum += lengths[i];
    if (val < sum) {
      return { index: i, remainder: val - sum + lengths[i] };
    }
  }
  return null;
}

export function constrain(val, min, max) {
  if (val < min) {
    return min;
  }
  if (val > max) {
    return max;
  }
  return val;
}

export function arrayToObject(arr) {
  const obj = {};
  arr.forEach((item) => (obj[item.uuid] = item));
  return obj;
}

export function contain(val, min, max) {
  if (val < min) val = min;
  if (val > max) val = max;
  return val;
}

export function getCenterShape(pList) {
  const closed = pList.map((v) => [v.x, v.z]);
  closed.push(closed[0]);
  const polygon = turf.polygon([closed]);
  const com = turf.center(polygon).geometry.coordinates;
  return new Vector3(com[0], 0, com[1]);
}

export function evaluate(t, range) {
  return t * (range[1] - range[0]) + range[0];
}

export function getMedialAxis(polygon, ratio, direction) {
  let bRect = getMinimumAABB(polygon);
  let slices = getDividedAABB(bRect, ratio, direction);
  let divisions = [];

  for (const slice of slices) {
    const intersections = getIntersections(slice, polygon);
    if (!intersections) {
      return null;
    }
    divisions.push(...intersections);
  }

  return divisions;

  function getDividedAABB(bRect, ratio, byLength) {
    const slices = [];

    let a, b, c, d;

    if (byLength) {
      if (bRect.length < bRect.width) {
        // change greater than
        a = bRect.points[0];
        b = bRect.points[3];
        c = bRect.points[2];
        d = bRect.points[1];
      } else {
        a = bRect.points[0];
        b = bRect.points[1];
        c = bRect.points[2];
        d = bRect.points[3];
      }
    } else {
      if (bRect.length > bRect.width) {
        // change greater than
        a = bRect.points[0];
        b = bRect.points[3];
        c = bRect.points[2];
        d = bRect.points[1];
      } else {
        a = bRect.points[0];
        b = bRect.points[1];
        c = bRect.points[2];
        d = bRect.points[3];
      }
    }

    const s1 = [],
      s2 = [];

    for (var i = 1; i < ratio.length; i++) {
      s1.push(pointOnLine(a, b, ratio[i]));
      s2.push(pointOnLine(d, c, ratio[i]));
    }

    for (var i = 0; i < ratio.length; i++) {
      if (i === 0) {
        slices.push([a, s1[i], s2[i], d]);
        continue;
      } else if (i === ratio.length - 1) {
        slices.push([s1[i - 1], b, c, s2[i - 1]]);
        continue;
      }

      slices.push([s1[i - 1], s1[i], s2[i], s2[i - 1]]);
    }

    return slices;
  }
}

export function getLargestRectangleFromEdgeIndex(polygon, i) {
  // console.log('polygon', polygon, i);
  const edge = [polygon[i], polygon[(i + 1) % polygon.length]];
  const v1 = edge[1].clone().sub(edge[0]);
  let angle = radToDeg(angleBetweenVectorAndXaxis(v1));
  if (v1.z > 0) {
    angle = -angle;
  }
  const rects = getLargestRectangleInPolygon(polygon, angle, 1); // might have multiple solution for the same axis.
  return rects[0]; // just return the first item
}

export function getRectanglesInPolygonCache(polygon) {
  const angles = [];
  for (let i = 0; i < polygon.length; i++) {
    // console.log('I', i, (i + 1) % polygon.length);
    const edge = [polygon[i], polygon[(i + 1) % polygon.length]];
    const v1 = edge[1].clone().sub(edge[0]);
    let angle = radToDeg(angleBetweenVectorAndXaxis(v1));
    if (v1.z > 0) {
      angle = -angle;
    }
    angles.push(angle);
  }
  const cache = [];
  // for (let i = 0; i < 90; i += 15) {
  //   const rects = getLargestRectangleInPolygon(polygon, i, 5);
  //   cache.push(...rects);
  // }
  // largest rectangles aligned to the edges
  for (const angle of angles) {
    const rects = getLargestRectangleInPolygon(polygon, angle, 5);
    cache.push(...rects);
  }
  cache.sort((a, b) => getArea(b) - getArea(a));
  return cache;
}

export function getLargestRectangleInPolygonAlongAABB(polygon, cellSize = 5) {
  const aabb = getMinimumAABB(polygon);
  // console.log('longest edge angle', longestEdgeAngle);

  const angle = aabb.angle;
  // console.log('My aabb:: ', aabb, longestEdgeAngle);

  const rects = rectInPolygon({
    polygon,
    angle,
    x: cellSize,
    y: cellSize,
  });
  rects.forEach((rect) => makeAntiClockwise(rect));

  rects.sort((a, b) => getArea(b) - getArea(a));

  return rects[0];
}

export function getLargestRectangleInPolygonAlongLongestEdge(polygon, cellSize = 5) {
  const longestEdge = getLongestEdgeOfPolygon(polygon);
  console.log('longest', longestEdge);
  const longestEdgeAngle = angleBetweenVectorAndXaxis(longestEdge[0].clone().sub(longestEdge[1]));
  console.log('longest edge angle', longestEdgeAngle);
  const angle = degrees(longestEdgeAngle);
  // console.log('My aabb:: ', aabb, longestEdgeAngle);

  const rects = rectInPolygon({
    polygon,
    angle,
    x: cellSize,
    y: cellSize,
  });
  console.log('rects', rects);
  rects.forEach((rect) => makeAntiClockwise(rect));

  rects.sort((a, b) => getArea(b) - getArea(a));

  return rects[0];
}

export function getLargestRectangleInPolygon(polygon, angle, cellSize = 5) {
  // console.log('My angle:: ', angle);
  // get array of angles for all sides
  const aabb = getMinimumAABB(polygon);
  const longestEdge = getLongestEdgeOfPolygon(polygon);
  const longestEdgeAngle = angleBetweenVectorAndXaxis(longestEdge[0].clone().sub(longestEdge[1]));
  // console.log('longest edge angle', longestEdgeAngle);
  if (angle === undefined) angle = longestEdgeAngle;
  // console.log('My aabb:: ', aabb, longestEdgeAngle);

  const rects = rectInPolygon({
    polygon,
    angle,
    x: cellSize,
    y: cellSize,
  });
  rects.forEach((rect) => makeAntiClockwise(rect));

  // rects.sort((a, b) => getArea(a) - getArea(b));
  return rects;
}

export function rectInPolygon({ polygon, angle, x, y, grade }) {
  if (!polygon || !polygon.length) {
    return null;
  }

  let cells = [];

  const bRect = getBoundingRectangle(polygon, angle);
  const o = bRect.points[0],
    ptX = bRect.points[1],
    ptY = bRect.points[3];
  const vX = getVectorFromPoints(o, ptX, true),
    vY = getVectorFromPoints(o, ptY, true);
  const lenX = distance(o, ptX),
    lenY = distance(o, ptY);
  const nX = floor(lenX / x),
    nY = floor(lenY / y);

  const xx = vX.x * x,
    xz = vX.z * x;
  const zx = vY.x * y,
    zz = vY.z * y;

  for (var i = 0; i < nX; i++) {
    for (var j = 0; j < nY; j++) {
      let pt1 = new Vector3(o.x + xx * i + zx * j, o.y, o.z + xz * i + zz * j);
      let pt2 = new Vector3(o.x + xx * (i + 1) + zx * j, o.y, o.z + xz * (i + 1) + zz * j);
      let pt3 = new Vector3(o.x + xx * (i + 1) + zx * (j + 1), o.y, o.z + xz * (i + 1) + zz * (j + 1));
      let pt4 = new Vector3(o.x + xx * i + zx * (j + 1), o.y, o.z + xz * i + zz * (j + 1));

      cells.push({ points: [pt1, pt2, pt3, pt4], grade: 1 });
    }
  }

  cells.forEach((cell) => {
    cell.points = makeAntiClockwise(cell.points);
    cell.points.forEach((v) => {
      if (!inside(v, polygon)) cell.grade = 0;
    });
  });

  const matrix = constructMatrix(cells, nX, nY);
  const indexes = maximalRectangle(matrix);
  const rects = [];
  for (const index of indexes) {
    const rect = getRect(cells, index, nX, nY);
    rects.push(rect);
  }

  return rects;
}
// UTILS
function getRect(cells, index, nX, nY) {
  const i1 = index[0][0] * nY + index[0][1];
  const c1 = cells[i1];
  const i2 = index[1][0] * nY + index[1][1];
  const c2 = cells[i2];
  // console.log("c1", c1);
  // console.log("c2", c2);
  const x1 = [];
  const z1 = [];
  const x2 = [];
  const z2 = [];
  for (let i = 0; i < c1.points.length; i++) {
    x1.push(c1.points[i].x);
    z1.push(c1.points[i].z);
    x2.push(c2.points[i].x);
    z2.push(c2.points[i].z);
  }
  const p0 = findSegmentIntersection(c2.points[1], c2.points[0], c1.points[3], c1.points[0]);
  const p1 = c2.points[1].clone();
  // const p2 = new Vector3(c1.points[3].x, 0, c2.points[1].z);
  const p2 = findSegmentIntersection(c2.points[2], c2.points[1], c1.points[2], c1.points[3]);
  const p3 = c1.points[3].clone();
  return [p0, p1, p2, p3];
}
function constructMatrix(cells, nX, nY) {
  const m = [];
  for (let i = 0; i < nX; i++) {
    const arr = [];
    m.push(arr);
  }
  for (let i = 0; i < cells.length; i++) {
    let x = Math.floor(i / nY);
    m[x].push(cells[i].grade);
  }
  return m;
}

function maximalRectangle(matrix) {
  if (!matrix.length) return 0;
  let indexes = [];
  const ROWS = matrix.length;
  const COLS = matrix[0].length;
  const dp = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  let maxArea = 0;

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      //update height
      if (row === 0) dp[row][col] = matrix[row][col] == '1' ? 1 : 0;
      else dp[row][col] = matrix[row][col] == '1' ? dp[row - 1][col] + 1 : 0;

      //update area
      let minHeight = dp[row][col];
      for (let pointer = col; pointer >= 0; pointer--) {
        if (minHeight === 0) break;
        if (dp[row][pointer] < minHeight) minHeight = dp[row][pointer];
        if (minHeight * (col - pointer + 1) >= maxArea) {
          const topLeft = [row - minHeight + 1, pointer];
          const bottomRight = [row, col];
          const index = [topLeft, bottomRight];
          if (minHeight * (col - pointer + 1) == maxArea) {
            indexes.push(index);
          } else if (minHeight * (col - pointer + 1) > maxArea) {
            indexes = [index];
            maxArea = minHeight * (col - pointer + 1);
          }
        }
        // maxArea = Math.max(maxArea, minHeight * (col - pointer + 1));
      }
    }
  }
  return indexes;
}

export function getPerimeterToAreaRatio(shape) {
  const area = getArea(shape);
  const perimeter = getPerimeter(shape);
  return perimeter / area;
}

function getPerimeter(shape) {
  let perimeter = 0;
  if (shape.length < 2) return perimeter;
  for (let i = 0; i < shape.length; i++) {
    const length = shape[i].distanceTo(shape[(i + 1) % shape.length]);
    perimeter += length;
  }
  return perimeter;
}

export function checkShortSegment(shape, threshold = 1) {
  for (let i = 0; i < shape.length; i++) {
    const length = shape[i].distanceTo(shape[(i + 1) % shape.length]);
    if (length < threshold) return true;
  }
  return false;
}

export function chamfer(polygon, angleThreshold, minEdgeLength) {
  var shavedVertices = [];

  for (var i = 0; i < polygon.length; i++) {
    var currentVertex = polygon[i];
    var previousVertex = polygon[(i - 1 + polygon.length) % polygon.length];
    var nextVertex = polygon[(i + 1) % polygon.length];

    // Calculate the angle between the edges connected to the current vertex
    var edge1 = previousVertex.clone().sub(currentVertex);
    var edge2 = nextVertex.clone().sub(currentVertex);
    var angle = edge1.angleTo(edge2);

    // If the angle is smaller than the threshold, shave the vertex
    if (angle < angleThreshold) {
      const dist = minEdgeLength / (2 * Math.sin(angle / 2));
      var newVertex1 = currentVertex.clone().add(edge1.normalize().multiplyScalar(dist));
      var newVertex2 = currentVertex.clone().add(edge2.normalize().multiplyScalar(dist));
      shavedVertices.push(newVertex1, newVertex2);
    } else {
      shavedVertices.push(currentVertex);
    }
  }

  return shavedVertices;
}

export function getStarInPolygon(polygon, thickness, nArms, startAngle) {
  // console.log('getStarInPolygon:: ', { polygon, thickness, nArms, startAngle });
  const center = getAveragePoint(polygon);
  const shapes = [];

  // const nArms = randomInteger([3, 4]);
  const increment = (2 * Math.PI) / nArms;
  // const startAngle = randomInRange([0, Math.PI]);
  const xAxis = new Vector3(1, 0, 0);

  for (let i = 0; i < nArms; i++) {
    const angle = startAngle + increment * i;
    const dir = rotateVector2D(xAxis.clone(), angle, true);
    const intersect = raycastToPolygon(center, dir, polygon);
    let shape = offsetPipeButt([center, intersect], thickness);
    shapes.push(shape);
  }

  const unions = getUnions(shapes);
  let largestUnion;
  let maxArea = 0;
  for (const union of unions) {
    const area = getArea(union);
    if (area > maxArea) {
      largestUnion = union;
      maxArea = area;
    }
  }
  return getIntersection(polygon, largestUnion);
}
