import * as THREE from 'three';
import { BufferGeometryUtils } from './BufferGeometryUtils.js';

function mod(x, m) {
  return ((x % m) + m) % m;
}

export function randomIndex(range) {
  return Math.round(Math.random() * (range - 1));
}

export function selectRandom(collection) {
  const index = randomIndex(collection.length);
  return collection[index];
}

export function shoelace(polygon) {
  let len = polygon.length;
  let sum = 0;
  let a = 0;
  let b = 0;
  let c = 0;

  //where is this mod

  for (var i = 0; i < len; i++) {
    a = polygon[mod(i, len)].x + polygon[mod(i + 1, len)].x;
    b = polygon[mod(i + 1, len)].z - polygon[mod(i, len)].z;
    c = a * b;
    sum += c;
  }

  return sum;
}

export function getShape(cell) {
  var shape = new THREE.Shape();
  var o = cell[0]; // origin of the shape
  if (o) {
    shape.moveTo(o.x, -o.z);
    for (var i = 1; i < cell.length; i++) {
      var pt = cell[i];
      shape.lineTo(pt.x, -pt.z);
    }
    shape.lineTo(o.x, -o.z);
    return shape;
  }
}

export function withinRadius(pt, radius) {
  const distance = Math.sqrt(pt.x * pt.x + pt.z * pt.z);

  if (distance < radius) {
    return true;
  }

  return false;
}

export function inside(point, vs) {
  let x = point.x;
  let y = point.z;

  let inside = false;

  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    let xi = vs[i].x,
      yi = vs[i].z;
    let xj = vs[j].x,
      yj = vs[j].z;

    let intersect = yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}

//arrPt is one that is not three js but of format [2,4,0] ie. not object

export function avg_arrPt(arrPt_arr) {
  let sum_x = 0;
  let sum_y = 0;
  let sum_z = 0;
  let len = arrPt_arr.length;

  for (let arrPt of arrPt_arr) {
    sum_x += arrPt[0];
    sum_y += arrPt[1];
    sum_z += arrPt[2];
  }

  sum_x /= len;
  sum_y /= len;
  sum_z /= len;

  return [sum_x, sum_y, sum_z];
}

export function avg_Pt(pt_arr, yOverride) {
  let sum_x = 0;
  let sum_y = 0;
  let sum_z = 0;
  let len = pt_arr.length;

  for (let pt of pt_arr) {
    sum_x += pt.x;
    sum_y += pt.y;
    sum_z += pt.z;
  }

  sum_x /= len;
  sum_y /= len;
  sum_z /= len;

  if (yOverride !== undefined && yOverride !== null) sum_y = yOverride;

  return new THREE.Vector3(sum_x, sum_y, sum_z);
}

export function find_avg_btmPt(vertices) {
  let temp_arr = [];

  for (let vertex of vertices) {
    if (vertex.y == 0) temp_arr.push(vertex);
  }

  return avg_Pt(temp_arr);
}

export function getLinePoint(x1, y1, x2, y2, t) {
  let x = (x1 - x2) * t + x2;
  let y = (y1 - y2) * t + y2;

  return new THREE.Vector3(x, 0.75, y);
}

export function get2PtAngle(x1, y1, x2, y2) {
  var p1 = {
    x: x1,
    y: y1,
  };
  var p2 = {
    x: x2,
    y: y2,
  };
  // angle in radians
  var angleRadians = Math.atan2(p2.y - p1.y, p2.x - p1.x);
  // angle in degrees
  var angleDeg = (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI;

  return angleRadians;
}

export function get2PtDistance(x1, y1, x2, y2) {
  var xs = x2 - x1;
  var ys = y2 - y1;

  xs *= xs;
  ys *= ys;

  return Math.sqrt(xs + ys);
}

export function getLineSegments(verts) {
  // returns array of line segments from a closed polyline

  let arr = [];

  for (var i = 0; i < verts.length - 1; i++) {
    arr.push([verts[i], verts[i + 1]]);
  }

  if (verts[0] != verts[verts.length - 1]) {
    arr.push([verts[0], verts[verts.length - 1]]);
  }

  return arr;
}

export function measure(lat1, lng1, lat2, lng2) {
  var R = 6378.137; // Radius of earth in KM
  var dLat = ((lat2 - lat1) * Math.PI) / 180;
  var dLng = ((lng2 - lng1) * Math.PI) / 180;
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;

  return d * 1000; // meters
}

export function arrayFromObject(object) {
  return Object.keys(object).map((key) => object[key]);
}

function processMultiMaterialMesh(insertedMeshes) {
  // console.log('processMultiMaterialMesh:: ', insertedMeshes);
  let materials = [],
    geometries = [],
    mergedGeometry = new THREE.BufferGeometry(),
    meshMaterial,
    mergedMesh;

  insertedMeshes.forEach(function (mesh, index) {
    mesh.updateMatrix();
    if (mesh.geometry) {
      // mesh.geometry.rotateX(Math.PI / 2);
      geometries.push(mesh.geometry);
      meshMaterial = new THREE.MeshStandardMaterial(mesh.material);

      materials.push(meshMaterial);
    }
  });

  // console.log('processMultiMaterialMesh:: ', geometries, materials);

  mergedGeometry = BufferGeometryUtils.mergeBufferGeometries(geometries, true);
  mergedGeometry.groupsNeedUpdate = true;

  mergedMesh = new THREE.Mesh(mergedGeometry, materials);

  return mergedMesh;
}

export const convertPtToTHREEVector = (pt) => {
  const { x, y, z } = pt;
  return new THREE.Vector3(x, y, z);
};

export const vector3ToShape = (vector) => {
  const { x, y, z } = vector;
  return { x, y, z };
};

export const copyPlots = (plots, removeChildren) => {
  const copy = JSON.parse(JSON.stringify(plots));
  for (const key in copy) {
    const plot = copy[key];
    //TODO:: simplify and use copyPlot function
    plot.shape = plot.shape.map((pt) => convertPtToTHREEVector(pt));
    plot.aabb.points = plot.aabb.points.map((pt) => convertPtToTHREEVector(pt));
    plot.aabb.axis = convertPtToTHREEVector(plot.aabb.axis);
    plot.longestEdge = plot.longestEdge.map((pt) => convertPtToTHREEVector(pt));
    plot.buildable = plot.buildable.map((pt) => convertPtToTHREEVector(pt));

    if (removeChildren) plot.children = [];
  }
  return copy;
};

export function Stopwatch() {
  return {
    start: null,
    stop: null,
    timer: function (start) {
      if (start) {
        this.start = new Date().getTime();
      } else {
        this.stop = new Date().getTime();
        return this.stop - this.start;
      }
    },
  };
}
