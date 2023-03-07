import * as THREE from 'three';
import SweeplineIntersectionsClass from 'sweepline-intersections/dist/SweeplineIntersectionsClass';
import { CSG } from 'three-csg-ts';
// import * as ThreeBSP from './libs/three-js-csg-es6.js';
import { pointLine } from './libs/intersects.js';
import { dataUtils } from './dataUtils.js';
import { faceUtils } from './faceutils';
import { polygonExtruder } from './polygonExtruder.js';
import { Node } from './libs/csg-tools';
import { isPolygonValid, offsetEdge } from '../math/offset-tools.js';
import { isClockWise, mod } from '../math/math-tools.js';

let dataUtilsInstance = new dataUtils();
let polyExtruder = new polygonExtruder();

//Recomputed building outlines
let buildingOutlineRecomputed;
let buildingInnerOutlineRecomputed;

let lastCorrectBuildingOutline;
let lastCorrectBuildingInnerOutline;

export class buildingDrawer {
  constructor() {
    this.recomputedOutline = false;
    this.recomputedInnerOutline = false;
    this.noInnerOutlinePresent = false;
    this.isExtrudedBuildingOutline = null;
  }
  drawBuildingFromOutline(
    buildingOutline,
    extrusionValue,
    edgeExtrusionValue,
    edgeNumber,
    isExtrudedBuildingOutline,
    material,
    buildingInnerOutlineJSON
  ) {
    this.isExtrudedBuildingOutline = isExtrudedBuildingOutline;

    //we need to test if the input outline has clockwise direction, if not we need to flip its direction
    buildingOutline = flipCounterClockwiseVec3Polygon(buildingOutline);

    let building;
    let unionMeshOffset;
    let extrusionVector = new THREE.Vector3(0, 1, 0);
    let buildingInnerOutline;

    // Use recomputed (changed by edge offsets) building contours
    if (this.recomputedOutline == true) {
      //we need to test if the input outline has clockwise direction, if not we need to flip its direction
      buildingOutline = flipCounterClockwiseVec3Polygon(buildingOutlineRecomputed);
    }

    if (buildingInnerOutlineJSON == undefined) {
      this.noInnerOutlinePresent = true;
    } else if (this.recomputedInnerOutline == true) {
      //we need to test if the input outline has clockwise direction, if not we need to flip its direction
      buildingInnerOutline = flipCounterClockwiseVec3Polygon(buildingInnerOutlineRecomputed);
    } else {
      //we need to test if the input outline has clockwise direction, if not we need to flip its direction
      buildingInnerOutline = flipCounterClockwiseVec3Polygon(buildingInnerOutlineJSON);
    }
    if (edgeExtrusionValue != 0) {
      if (isExtrudedBuildingOutline) {
        //is the external building outline being extruded
        let tempBuildingOutlineAB = offsetEdge(buildingOutline, {
          index: mod(edgeNumber - 1, buildingOutline.length),
          dist: edgeExtrusionValue,
        });
        // let tempBuildingOutlineAB = this.offsetPolygonEdge(buildingOutline, edgeExtrusionValue, edgeNumber);
        if (isPolygonValid(tempBuildingOutlineAB)) buildingOutline = tempBuildingOutlineAB;
      } else if (this.noInnerOutlinePresent == false) {
        let tempBuildingInnerOutline1AB = offsetEdge(buildingInnerOutline, {
          index: mod(edgeNumber - 1, buildingOutline.length),
          dist: edgeExtrusionValue,
        });
        if (isPolygonValid(tempBuildingInnerOutline1AB)) buildingInnerOutline = tempBuildingInnerOutline1AB;
      }

      // Building outline - inner outline difference
      let buildingSubMesh = this.createBuildingMesh(
        buildingOutline,
        buildingInnerOutline,
        extrusionVector,
        extrusionValue
      ).toMesh(new THREE.Matrix4(), material);

      unionMeshOffset = buildingSubMesh;
    } else {
      unionMeshOffset = this.createBuildingMesh(
        buildingOutline,
        buildingInnerOutline,
        extrusionVector,
        extrusionValue
      ).toMesh(new THREE.Matrix4(), material);
    }

    lastCorrectBuildingOutline = buildingOutline;
    lastCorrectBuildingInnerOutline = buildingInnerOutline;

    return (building = { mesh: unionMeshOffset, innerOutline: buildingInnerOutline, outline: buildingOutline });
  }

  useRecomputedOutline(outline) {
    buildingOutlineRecomputed = outline;
    this.recomputedOutline = true;
  }

  useRecomputedInnerOutline(innerOutline) {
    buildingInnerOutlineRecomputed = innerOutline;
    this.recomputedInnerOutline = true;
  }

  createBuildingMesh(buildingOutline, buildingInnerOutline, extrusionVector, extrusionValue) {
    let buildingMesh;

    // Building outline extrusion
    let buildingOutlineVec3 = buildingOutline;
    let buildingOutlineCSGPoly = dataUtilsInstance.createCSGPolygonFromPoints(buildingOutlineVec3, extrusionVector);

    let buildingOutlineNode = new Node(
      polyExtruder.extrudeFromPolygon(buildingOutlineCSGPoly, extrusionValue, extrusionVector)
    );

    if (buildingOutlineNode.back != undefined) {
      buildingOutlineNode.invert();
    }
    if (buildingOutlineNode.front != undefined) {
      buildingOutlineNode.invert();
    }

    //if (buildingOutlineNode.back != undefined && buildingOutlineNode.front != undefined) { buildingOutlineNode.invert()  }

    let buildingOutlineMesh = CSG.fromPolygons(buildingOutlineNode.allPolygons());

    if (this.noInnerOutlinePresent == false) {
      // Building inner outline extrusion (outline offset inwards)
      let buildingInnerOutlineVec3 = buildingInnerOutline;
      let buildingInnerOutlineCSGPoly = dataUtilsInstance.createCSGPolygonFromPoints(
        buildingInnerOutlineVec3,
        extrusionVector
      );
      let buildingInnerOutlineNode = new Node(
        polyExtruder.extrudeFromPolygon(buildingInnerOutlineCSGPoly, extrusionValue, extrusionVector)
      );

      if (buildingInnerOutlineNode.back != undefined) {
        buildingInnerOutlineNode.invert();
      }
      if (buildingInnerOutlineNode.front != undefined) {
        buildingInnerOutlineNode.invert();
      }

      let buildingInnerOutlineMesh = CSG.fromPolygons(buildingInnerOutlineNode.allPolygons());
      // Building outline - inner outline difference
      buildingMesh = buildingOutlineMesh.subtract(buildingInnerOutlineMesh);
    } else if (this.noInnerOutlinePresent == true) {
      buildingMesh = buildingOutlineMesh;
    }

    return buildingMesh;
  }

  /**
   * Face selection and extrusion
   */
  selectedBuildingFaceID(buildingOutline, buildingInnerOutline, transformControlAttachment) {
    let outlineEdgeNo;
    let innerOutlineEdgeNo;
    let isOutlineEdgeSelected;
    let selectedEdgeNumber;

    //we need to keep all outlines in one direction to get proper edge numbering
    buildingOutline = flipCounterClockwiseVec3Polygon(buildingOutline);
    if (buildingInnerOutline != undefined) {
      buildingInnerOutline = flipCounterClockwiseVec3Polygon(buildingInnerOutline);
    }
    let XZPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0));
    let tsOnXZ = new THREE.Vector3();
    XZPlane.projectPoint(transformControlAttachment.position, tsOnXZ);

    let outlineEdges = getPolygonVec3Edges(buildingOutline);
    outlineEdgeNo = getIntersectedByPointOnXZEdgeNumber(tsOnXZ, outlineEdges);

    if (this.noInnerOutlinePresent == false) {
      let innerOutlineEdges = getPolygonVec3Edges(buildingInnerOutline);
      innerOutlineEdgeNo = getIntersectedByPointOnXZEdgeNumber(tsOnXZ, innerOutlineEdges);
    } else if (this.noInnerOutlinePresent == true) {
      innerOutlineEdgeNo = undefined;
    }

    if (innerOutlineEdgeNo == undefined && outlineEdgeNo != undefined) {
      isOutlineEdgeSelected = true;
      selectedEdgeNumber = outlineEdgeNo + 1;
    } else if (innerOutlineEdgeNo != undefined && outlineEdgeNo == undefined) {
      isOutlineEdgeSelected = false;
      selectedEdgeNumber = innerOutlineEdgeNo + 1;
    }
    return { edgeNO: selectedEdgeNumber, isOutlineSelected: isOutlineEdgeSelected };
  }

  setBuildingEdgeExtrusionValue(face, geometry, transformControlAttachment) {
    let value;

    let faceBoundigBox = faceUtils.getFaceBoundigBox(face, geometry);
    let boundingBoxCenter = faceBoundigBox.getCenter(new THREE.Vector3());
    let shift = transformControlAttachment.position.clone();

    let direction = new THREE.Vector3();
    direction = direction.subVectors(boundingBoxCenter, shift).normalize();

    let dot = face.normal.dot(direction);
    value = -dot * boundingBoxCenter.distanceTo(shift);

    if (!this.isExtrudedBuildingOutline) {
      return -1 * value;
    }

    return value;
  }

  static checkBuildingPlotColision(outline, plot, material) {
    let outlinePolygon = dataUtilsInstance.makePolygonToSliceFromVec3(outline);
    let plotPolygon = dataUtilsInstance.makePolygonToSliceFromVec3(plot);

    let polygon1 = { type: 'Polygon', coordinates: [outlinePolygon] };
    let polygon2 = { type: 'Polygon', coordinates: [plotPolygon] };

    polygon1.coordinates[0].push(outlinePolygon[0]);
    polygon2.coordinates[0].push(plotPolygon[0]);

    // create the base instance of Sweepline Intersections
    let sl = new SweeplineIntersectionsClass();

    // populate the event queue with your primary geometry
    sl.addData(polygon1);
    sl.addData(polygon2);

    let intersectionPoints = sl.getIntersections();

    if (intersectionPoints.length > 0) {
      material.color = new THREE.Color(0xd21404);
    } else {
      material.color = new THREE.Color(0xffffff);
    }
  }

  offsetPolygonEdge(polygon, offset, edgeNo) {
    edgeNo = edgeNo - 1;

    let safetyTreshold = offset + offset / 100;
    let edgesVec3 = getPolygonEdgesVec3(polygon);

    let points = movePointsAlongTheLines(edgesVec3, edgeNo, offset);

    let counter = 0;

    while (pointsAreOnEdge(polygon, points.point1, points.point2, 0.01) && counter < 5) {
      points = movePointsAlongTheLines(edgesVec3, edgeNo, safetyTreshold);

      safetyTreshold = safetyTreshold + offset / 100;

      counter++;
    }

    polygon = updatePolygon(points.point1, points.point2, polygon, edgeNo);

    if (buildingDrawer.isSelfIntersected(polygon)) {
      polygon = lastCorrectBuildingOutline;
    }

    if (this.noInnerOutlinePresent == false) {
      if (this.isExtrudedBuildingOutline) {
        const temp2 = [...polygon, ...lastCorrectBuildingInnerOutline];
        if (buildingDrawer.isSelfIntersected(temp2)) {
          polygon = flipCounterClockwiseVec3Polygon(lastCorrectBuildingOutline);

          return polygon;
        }
      }

      if (!this.isExtrudedBuildingOutline) {
        const temp = [...polygon, ...lastCorrectBuildingOutline];
        if (buildingDrawer.isSelfIntersected(temp)) {
          polygon = flipCounterClockwiseVec3Polygon(lastCorrectBuildingInnerOutline);

          return polygon;
        }
      }
    }

    return polygon;
  }

  //Checks if polygon is selfintersected
  static isSelfIntersected(polygon) {
    let isSelfIntersected = false;

    let coordinates = dataUtilsInstance.makePolygonToSliceFromVec3(polygon);
    let poly = { type: 'Polygon', coordinates: [coordinates] };
    //poly.coordinates[0].push(coordinates[0])

    let sl = new SweeplineIntersectionsClass();
    sl.addData(poly);

    let intersectionPoints = sl.getIntersections();

    if (intersectionPoints.length > 0) {
      isSelfIntersected = true;
    }

    return isSelfIntersected;
  }
}

function offsetContour(offset, contour) {
  let result = [];

  offset = new THREE.BufferAttribute(new Float32Array([offset, 0, 0]), 3);

  for (let i = 0; i < contour.length; i++) {
    let contourV1 = contour[i - 1 < 0 ? contour.length - 1 : i - 1];
    let contourV2 = contour[i + 1 == contour.length ? 0 : i + 1];
    let contourV3 = contour[i];

    let vert1 = new THREE.Vector2(contourV1.x, contourV1.z);
    let vert2 = new THREE.Vector2(contourV2.x, contourV2.z);
    let vert3 = new THREE.Vector2(contourV3.x, contourV3.z);

    let v1 = new THREE.Vector2().subVectors(vert1, vert3);
    let v2 = new THREE.Vector2().subVectors(vert2, vert3);
    let angle = v2.angle() - v1.angle();
    let halfAngle = angle * 0.5;

    let hA = halfAngle;
    let tA = v2.angle() + Math.PI * 0.5;

    let shift = Math.tan(hA - Math.PI * 0.5);
    let shiftMatrix = new THREE.Matrix4().set(1, 0, 0, 0, -shift, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);

    let tempAngle = tA;
    let rotationMatrix = new THREE.Matrix4().set(
      Math.cos(tempAngle),
      -Math.sin(tempAngle),
      0,
      0,
      Math.sin(tempAngle),
      Math.cos(tempAngle),
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      1
    );

    let translationMatrix = new THREE.Matrix4().set(
      1,
      0,
      0,
      contour[i].x,
      0,
      1,
      0,
      contour[i].z,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      1
    );

    let cloneOffset = offset.clone();
    cloneOffset.applyMatrix4(shiftMatrix);
    cloneOffset.applyMatrix4(rotationMatrix);
    cloneOffset.applyMatrix4(translationMatrix);

    result.push(new THREE.Vector3(cloneOffset.getX(0), 0, cloneOffset.getY(0)));
  }

  return result;
}

function getPolygonVec3Edges(polygon) {
  let edges = [];

  for (let i = 0; i < polygon.length; i++) {
    if (i == polygon.length - 1) {
      edges.push([polygon[polygon.length - 1].x, polygon[polygon.length - 1].z, polygon[0].x, polygon[0].z]);
    } else {
      edges.push([polygon[i].x, polygon[i].z, polygon[i + 1].x, polygon[i + 1].z]);
    }
  }
  return edges;
}

function getPolygonEdgesVec3(polygon) {
  let edges = [];

  for (let i = 0; i < polygon.length; i++) {
    if (i == polygon.length - 1) {
      edges.push([polygon[polygon.length - 1], polygon[0]]);
    } else {
      edges.push([polygon[i], polygon[i + 1]]);
    }
  }

  return edges;
}

function getIntersectedByPointOnXZEdgeNumber(point, edges) {
  let edgeNO;
  for (let i = 0; i < edges.length; i++) {
    let intersects = pointLine(point.x, point.z, edges[i][0], edges[i][1], edges[i][2], edges[i][3], 0.1);
    if (intersects) {
      edgeNO = i;
    }
  }
  return edgeNO;
}

function flipCounterClockwiseVec3Polygon(polygon) {
  let isDirectionCorrect = checkVec3PolygonDirection(polygon);

  if (isDirectionCorrect == false) {
    //the polygon is counter-clockwise
    polygon.reverse();
  }

  return polygon;
}

export function checkVec3PolygonDirection(polygon) {
  let isClockwise;

  let edges = getPolygonVec3Edges(polygon);

  let sum = 0;
  for (let i = 0; i < edges.length; i++) {
    sum = sum + (edges[i][2] - edges[i][0]) * (edges[i][3] + edges[i][1]); //(x2 − x1)(y2 + y1)
  }

  if (sum > 0) {
    isClockwise = true; //clockwise
  } else if (sum < 0) {
    isClockwise = false; //counter-clockwise
  }

  return isClockwise;
}

function movePointsAlongTheLines(edges, edgeNo, distance) {
  let point1;
  let point2;

  if (edgeNo == 0) {
    point1 = getPositionAlongTheLine(edges[edges.length - 1][0], edges[edges.length - 1][1], distance, edges[edgeNo]);
    point2 = getPositionAlongTheLine(edges[1][1], edges[1][0], distance, edges[edgeNo]);
  }

  //If selected edge is the last one
  else if (edgeNo == edges.length - 1) {
    point1 = getPositionAlongTheLine(edges[edges.length - 2][0], edges[edges.length - 2][1], distance, edges[edgeNo]);
    point2 = getPositionAlongTheLine(edges[0][1], edges[0][0], distance, edges[edgeNo]);
  } else {
    point1 = getPositionAlongTheLine(edges[edgeNo - 1][0], edges[edgeNo - 1][1], distance, edges[edgeNo]);
    point2 = getPositionAlongTheLine(edges[edgeNo + 1][1], edges[edgeNo + 1][0], distance, edges[edgeNo]);
  }

  return { point1: point1, point2: point2 };
}

function getPositionAlongTheLine(point, target, offset, edge) {
  let offsetDirAngle = Math.atan2(target.z - point.z, target.x - point.x);
  let dirVector = new THREE.Vector3(target.x - point.x, 0, target.z - point.z).normalize();

  let dx = edge[1].x - edge[0].x;
  let dy = edge[1].z - edge[0].z;

  let edgeNormal = new THREE.Vector3(-dy, 0, dx).normalize();
  let dirEdgeNormalAngle = dirVector.angleTo(edgeNormal);

  let normalCos = Math.cos(dirEdgeNormalAngle); // sign of the offset

  let adjustedOffset;

  if (Math.abs(normalCos) < 0.000001 && normalCos != 0) {
    adjustedOffset = offset;
  } else {
    adjustedOffset = offset / normalCos;
  }

  let xOffset = Math.sin(offsetDirAngle) * adjustedOffset;
  let yOffset = Math.cos(offsetDirAngle) * adjustedOffset;

  let movedPoint = new THREE.Vector3(target.x + yOffset, 0, target.z + xOffset);

  return movedPoint;
}

function pointsAreEqual(P1, P2, treshold) {
  let dist3 = Math.sqrt((P2.x - P1.x) ** 2 + (P2.y - P1.y) ** 2 + (P2.z - P1.z) ** 2);
  return dist3 < treshold;
}

function pointsAreOnEdge(polygon, pointA, pointB, treshold) {
  for (let i = 0; i < polygon.length; i++) {
    let point1 = polygon[i];
    let point2 = polygon[i + 1];

    if (i == polygon.length - 1) {
      point1 = polygon[i];
      point2 = polygon[0];
    } else {
      point1 = polygon[i];
      point2 = polygon[i + 1];
    }

    let duplicated1 = pointsAreEqual(pointA, point1, treshold);
    let duplicated2 = pointsAreEqual(pointA, point2, treshold);
    let duplicated3 = pointsAreEqual(pointB, point1, treshold);
    let duplicated4 = pointsAreEqual(pointB, point2, treshold);

    if (duplicated1 == true || duplicated2 == true || duplicated3 == true || duplicated4 == true) {
      return true;
    }
  }

  return false;
}

function updatePolygon(point1, point2, polygon, edgeNo) {
  let newPolygon = [...polygon];

  //If selected edge is the last one
  if (edgeNo == polygon.length - 1) {
    newPolygon[edgeNo] = point1;
    newPolygon[0] = point2;
  } else {
    newPolygon[edgeNo] = point1;
    newPolygon[edgeNo + 1] = point2;
  }

  return newPolygon;
}
