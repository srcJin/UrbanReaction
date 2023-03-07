import * as THREE from 'three';
import { CSG } from 'three-csg-ts';
// import * as ThreeBSP from './libs/three-js-csg-es6.js';
import { faceUtils } from './faceutils';
import { dataUtils } from './dataUtils.js';
import { checkVec3PolygonDirection } from './buildingDrawer.js';

import PolyBool from 'polybooljs';

import _ from 'lodash';
import { Node, Polygon, Vertex } from './libs/csg-tools';

let dataUtilsInstance = new dataUtils();

export class polygonExtruder {
  constructor() {}
  // Create a CSG extrusion from a threeJs triangle, depth is the distance along the normal vector you want to extrude
  // From from https://github.com/willkessler/cutplane_js/blob/master/cut.js
  extrudeFromPolygon(polygon, depth, direction) {
    var top,
      bottom,
      side,
      polygons = [],
      sideVec1,
      sideVec2,
      sideNormal,
      sideVertices;

    var numVertices = polygon.vertices.length;
    let extrusionVector;
    if (direction === undefined) {
      // extrusionVector = polygon.normal.normal.clone(); //var extrusionVector = polygon.plane.normal.clone().times(depth)
      extrusionVector = polygon.plane.normal.clone();
    } else {
      extrusionVector = direction.clone();
    }
    extrusionVector = new THREE.Vector3(
      extrusionVector.x * depth,
      extrusionVector.y * depth,
      extrusionVector.z * depth
    );
    bottom = polygon.clone();
    top = polygon.clone();
    top = translate(polygon, extrusionVector);

    let topTriangles = this.triangulateCSGPolygon(top, direction);
    for (let i = 0; i < topTriangles.length; i++) {
      let poly = this.flipCSGPolygon(topTriangles[i]);
      polygons.push(poly);
    }

    top = this.flipCSGPolygon(top);
    bottom = this.flipCSGPolygon(bottom);

    for (var i = 0; i < numVertices; ++i) {
      sideVertices = [];
      sideVec1 = minus(top.vertices[i].pos, bottom.vertices[i].pos).normalize();
      sideVec2 = minus(bottom.vertices[(i + 1) % numVertices].pos, bottom.vertices[i].pos).normalize();
      sideNormal = sideVec2.cross(sideVec1);
      sideVertices.push(
        new Vertex(
          new THREE.Vector3(bottom.vertices[i].pos.x, bottom.vertices[i].pos.y, bottom.vertices[i].pos.z),
          sideNormal,
          new THREE.Vector3()
        )
      );
      sideVertices.push(
        new Vertex(
          new THREE.Vector3(
            bottom.vertices[(i + 1) % numVertices].pos.x,
            bottom.vertices[(i + 1) % numVertices].pos.y,
            bottom.vertices[(i + 1) % numVertices].pos.z
          ),
          sideNormal,
          new THREE.Vector3()
        )
      );
      sideVertices.push(
        new Vertex(
          new THREE.Vector3(
            top.vertices[(i + 1) % numVertices].pos.x,
            top.vertices[(i + 1) % numVertices].pos.y,
            top.vertices[(i + 1) % numVertices].pos.z
          ),
          sideNormal,
          new THREE.Vector3()
        )
      );
      sideVertices.push(
        new Vertex(
          new THREE.Vector3(top.vertices[i].pos.x, top.vertices[i].pos.y, top.vertices[i].pos.z),
          sideNormal,
          new THREE.Vector3()
        )
      );
      side = new Polygon(sideVertices);
      polygons.push(side);
    }

    let bottomTriangles = this.triangulateCSGPolygon(bottom, direction);
    for (let i = 0; i < bottomTriangles.length; i++) {
      let poly = this.flipCSGPolygon(bottomTriangles[i]);
      poly.flip();
      polygons.push(poly);
    }

    return polygons;
  }

  faceExtrude(mainMesh, geometry, face_group, amount, faceNormal, material) {
    var extrusionPlane;
    var faceGroupVertices = [];

    for (var i = 0; i < face_group.length; i++) {
      //get vertices ID
      var f = face_group[i];
      var a = f.a;
      var b = f.b;
      var c = f.c;

      //clone vertices
      var v1 = geometry.vertices[a].clone();
      var v2 = geometry.vertices[b].clone();
      var v3 = geometry.vertices[c].clone();

      faceGroupVertices.push(v1, v2, v3);
    }

    extrusionPlane = getExtrusionPlane(faceGroupVertices);
    var result = getUnifiedPolygonFromFaces(face_group, geometry, extrusionPlane);
    var translatedPoints = translateMergedPolygonsToOrigin(faceGroupVertices, result, extrusionPlane);

    let initialMeshToUnion = new THREE.Mesh(geometry, material);

    // Make sure the .matrix of base mesh is current
    initialMeshToUnion.updateMatrix();

    // Extrude using cleaned boundary edges of geometry faces -
    var currentNode = new Node(
      this.extrudeFromPolygon(
        dataUtilsInstance.createCSGPolygonFromPoints(translatedPoints, faceNormal),
        amount,
        faceNormal
      )
    );

    if (currentNode.back != undefined) {
      currentNode.invert();
    }
    if (currentNode.front != undefined) {
      currentNode.invert();
    }

    var currentMeshToUnion = CSG.fromPolygons(currentNode.polygons);
    const baseMesh = CSG.fromMesh(initialMeshToUnion);
    let unionMesh;

    // Based on extrusion value either union the extrusion or substract.
    if (amount > 0) {
      unionMesh = baseMesh.union(currentMeshToUnion);
      mainMesh = unionMesh.toMesh();
    } else if (amount < 0) {
      unionMesh = baseMesh.subtract(currentMeshToUnion);
      mainMesh = unionMesh.toMesh();
    } else {
      unionMesh = mainMesh;
    }

    //needed for properly detecting the colinear triangles in new CSG geometry
    correctDuplicateVertices(mainMesh.geometry);

    return mainMesh;
  }

  setMeshFaceExtrusionValue(face, geometry, transformControlAttachment) {
    let value;
    var faceBoundigBox = faceUtils.getFaceBoundigBox(face, geometry);
    var boundingBoxCenter = faceBoundigBox.getCenter(new THREE.Vector3());
    let shift = transformControlAttachment.position.clone();

    //Compute extrusion based on face normal
    if (face.normal.x == 1 || face.normal.x == -1) {
      //value = Math.max(- face.normal.x * shift.subVectors(boundingBoxCenter, shift).x, 0.001)
      value = -face.normal.x * shift.subVectors(boundingBoxCenter, shift).x;
    } else if (face.normal.y == 1 || face.normal.y == -1) {
      value = -face.normal.y * shift.subVectors(boundingBoxCenter, shift).y;
    } else if (face.normal.z == 1 || face.normal.z == -1) {
      value = -face.normal.z * shift.subVectors(boundingBoxCenter, shift).z;
    } else {
      //To do
      value = 0;
    }

    return value;
  }

  triangulateCSGPolygon(polygon, faceNormal) {
    let tempY = polygon.vertices[0].pos.y;

    let vec2fromCSG = [];
    for (let i = 0; i < polygon.vertices.length; i++) {
      let vec2 = new THREE.Vector2(polygon.vertices[i].pos.x, polygon.vertices[i].pos.z);
      vec2fromCSG.push(vec2);
    }

    let triangulatedPolygon = THREE.ShapeUtils.triangulateShape(vec2fromCSG, []); // this function uses vec2

    let trianglesCSG = [];
    for (let i = 0; i < triangulatedPolygon.length; i++) {
      let a = triangulatedPolygon[i][0];
      let b = triangulatedPolygon[i][1];
      let c = triangulatedPolygon[i][2];

      let v1 = new THREE.Vector3(polygon.vertices[a].pos.x, tempY, polygon.vertices[a].pos.z);
      let v2 = new THREE.Vector3(polygon.vertices[b].pos.x, tempY, polygon.vertices[b].pos.z);
      let v3 = new THREE.Vector3(polygon.vertices[c].pos.x, tempY, polygon.vertices[c].pos.z);

      let triangle = [v1, v2, v3];

      let triangleCSG = dataUtilsInstance.createCSGPolygonFromPoints(triangle, faceNormal);

      trianglesCSG.push(triangleCSG);
    }

    return trianglesCSG;
  }

  flipCSGPolygon(polygon) {
    let vec3fromCSG = [];
    for (let i = 0; i < polygon.vertices.length; i++) {
      let vec3 = new THREE.Vector3(polygon.vertices[i].pos.x, polygon.vertices[i].pos.y, polygon.vertices[i].pos.z);
      vec3fromCSG.push(vec3);
    }

    //we need to keep all CSG polygons in one direction to produce meshes with normals in the one direction
    let direction = checkVec3PolygonDirection(vec3fromCSG);

    if (direction == true) {
      polygon.flip();
    }

    return polygon;
  }
}

// Checks if given polygon is parrallel to XY-plane, YZ-plane, and XZ-plane
function getExtrusionPlane(points) {
  let extrusionVector;
  let XYparrallel = 0;
  let YZparrallel = 0;
  let XZparrallel = 0;

  // checking polygon vertices coordinate equality
  for (var i = 0; i < points.length - 1; i++) {
    if (points[i].z == points[i + 1].z) {
      //XY
      XYparrallel++;
    }
    if (points[i].x == points[i + 1].x) {
      //YZ
      YZparrallel++;
    }
    if (points[i].y == points[i + 1].y) {
      //XZ
      XZparrallel++;
    }
  }

  if (Math.abs(XYparrallel - (points.length - 1)) == 0) {
    //console.log('Polygon is parallel to XY plane')
    return (extrusionVector = new THREE.Vector3(0, 0, 1));
  } else if (Math.abs(YZparrallel - (points.length - 1)) == 0) {
    //console.log('Polygon is parallel to YZ plane')
    return (extrusionVector = new THREE.Vector3(1, 0, 0));
  } else if (Math.abs(XZparrallel - (points.length - 1)) == 0) {
    //console.log('Polygon is parallel to XZ plane')
    return (extrusionVector = new THREE.Vector3(0, 1, 0));
  } else {
    //console.log('Not parallel to XY, YZ and XZ')
  }
}

function translate(polygon, vector) {
  var translatedPolygon;
  var vertexMap;
  var vi;
  for (var i = 0; i < polygon.vertices.length; ++i) {
    vi = polygon.vertices[i];
    vertexMap = vi.vertexMap;
    if (vertexMap) {
      for (var vm of vertexMap) {
        vm.x += vector.x;
        vm.y += vector.y;
        vm.z += vector.z;
      }
    } else {
      vi.pos.x += vector.x;
      vi.pos.y += vector.y;
      vi.pos.z += vector.z;
    }
  }
  return (translatedPolygon = polygon);
}

function minus(a, b) {
  return new THREE.Vector3(b.x - a.x, b.y - a.y, b.z - a.z);
}

//Code fixing CSG issue with duplicated vertices breaking colinear triangle detection
//from https://github.com/willkessler/cutplane_js/blob/master/cut.js
function correctDuplicateVertices(geometry) {
  var vertexMap = createDuplicateVertexMap(geometry.vertices);
  for (var face of geometry.faces) {
    face.a = vertexMap[face.a];
    face.b = vertexMap[face.b];
    face.c = vertexMap[face.c];
  }
}

function createDuplicateVertexMap(vertices) {
  var vertexMap = {};
  vertexMap[0] = 0; // first vertex is nearest to itself
  var nearest;
  var numVerts = vertices.length;
  for (var vv = 1; vv < numVerts; ++vv) {
    nearest = _.find(_.keys(vertexMap), function (key) {
      return pointsAreEqual(vertices[key], vertices[vv]);
    });
    if (nearest) {
      vertexMap[vv] = parseInt(nearest);
    } else {
      vertexMap[vv] = vv;
    }
  }
  return vertexMap;
}

function pointsAreEqual(P0, P1) {
  let dist3 = Math.sqrt(P0.x - P1.x) + Math.sqrt(P0.y - P1.y) + Math.sqrt(P0.z - P1.z);
  return dist3 < 0.087 * 0.087;
}

function getUnifiedPolygonFromFaces(faces, geometry, extrusionVector) {
  var unifiedPolygon;
  var polygonsFromFaces = makePolyBoolPolygons(faces, geometry, extrusionVector);

  //Get only vertex in outer edges by cooplanar triangle union
  var segments = PolyBool.segments(polygonsFromFaces[0]);
  for (var i = 0; i < polygonsFromFaces.length; i++) {
    var seg2 = PolyBool.segments(polygonsFromFaces[i]);
    var comb = PolyBool.combine(segments, seg2);
    segments = PolyBool.selectUnion(comb);
  }

  unifiedPolygon = PolyBool.polygon(segments);
  return unifiedPolygon;
}

function makePolyBoolPolygons(faces, geometry, extrusionVector) {
  var polygonsFromFaces = [];

  for (var i = 0; i < faces.length; i++) {
    // polyBool polygon format
    var polygonFromFace = {
      regions: [], // list of regions each region is a list of points
      inverted: false, // is this polygon inverted?
    };

    //get vertices ID
    var f = faces[i];
    var a = f.a;
    var b = f.b;
    var c = f.c;

    //clone vertices
    var v1 = geometry.vertices[a].clone();
    var v2 = geometry.vertices[b].clone();
    var v3 = geometry.vertices[c].clone();

    //make PolyBool polygon from Three.face based on extrusion plane
    if (extrusionVector.z == 1) {
      // XY plane
      polygonFromFace.regions.push([
        [v1.x, v1.y],
        [v2.x, v2.y],
        [v3.x, v3.y],
      ]);
    } else if (extrusionVector.x == 1) {
      // YZ plane
      polygonFromFace.regions.push([
        [v1.z, v1.y],
        [v2.z, v2.y],
        [v3.z, v3.y],
      ]);
    } else if (extrusionVector.y == 1) {
      // XZ plane
      polygonFromFace.regions.push([
        [v1.x, v1.z],
        [v2.x, v2.z],
        [v3.x, v3.z],
      ]);
    }
    polygonsFromFaces.push(polygonFromFace);
  }
  return polygonsFromFaces;
}

function translateMergedPolygonsToOrigin(originalPoints, points, extrusionVector) {
  var pointsToVector3 = [];
  var translatedVectors3 = [];

  for (var i = 0; i < points.regions[0].length; i++) {
    var pointToVector3 = new THREE.Vector3(points.regions[0][i][0], points.regions[0][i][1], 0);
    pointsToVector3.push(pointToVector3);
  }

  //this can be done in one loop above
  for (var i = 0; i < pointsToVector3.length; i++) {
    var point = pointsToVector3[i];
    //translate PolyBool polygon based on extrusion plane
    if (extrusionVector.z == 1) {
      // XY plane
      var z = originalPoints[0].z;
      translatedVectors3.push(new THREE.Vector3(point.x, point.y, z));
    } else if (extrusionVector.x == 1) {
      // YZ plane
      var x = originalPoints[0].x;
      translatedVectors3.push(new THREE.Vector3(x, point.y, point.x));
    } else if (extrusionVector.y == 1) {
      // XZ plane
      var y = originalPoints[0].y;
      translatedVectors3.push(new THREE.Vector3(point.x, y, point.y));
    }
  }

  return translatedVectors3;
}
