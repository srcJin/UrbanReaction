import * as THREE from 'three';
// import * as ThreeBSP from './libs/three-js-csg-es6.js';
import { Node, Polygon, Vertex } from './libs/csg-tools';

export class dataUtils {
  constructor() {}
  /**
   *  Data translators
   */
  vec2ToVec3onXZ(vectors2) {
    var vectors3 = [];
    for (var i = 0; i < vectors2.length; i++) {
      var vector3 = new THREE.Vector3(vectors2[i].x, 0, vectors2[i].y);
      vectors3.push(vector3);
    }
    return vectors3;
  }

  vec3ToVec2(vectors3) {
    var vectors2 = [];
    for (var i = 0; i < vectors3.length; i++) {
      var vector2 = new THREE.Vector2(vectors3[i].x, vectors3[i].z);
      vectors2.push(vector2);
    }
    return vectors2;
  }

  makePolygonToSliceFromVec2(contour) {
    var poly = [];

    for (var i = 0; i < contour.length; i++) {
      var point = [];
      point.push(contour[i].x);
      point.push(contour[i].y);
      poly.push(point);
    }

    return poly;
  }

  makePolygonToSliceFromVec3(contour) {
    var poly = [];

    for (var i = 0; i < contour.length; i++) {
      var point = [];
      point.push(contour[i].x);
      point.push(contour[i].z);
      poly.push(point);
    }

    return poly;
  }

  createCSGPolygonFromPoints(points, faceNormal) {
    var CSGvertices = [];

    //Create CSG Vertex from ThreeJS points
    for (var i = 0; i < points.length; i++) {
      var vertex = new Vertex(
        new THREE.Vector3(points[i].x, points[i].y, points[i].z),
        faceNormal,
        new THREE.Vector3()
      );
      CSGvertices.push(vertex);
    }

    var polygon = new Polygon(CSGvertices);
    return polygon;
  }

  getVec2FromJSONShapeData(shapeData) {
    let vec2Array = [];

    for (let i = 0; i < shapeData.length; i++) {
      let vector2 = new THREE.Vector2(shapeData[i].x, shapeData[i].z);
      vec2Array.push(vector2);
    }

    return vec2Array.reverse();
  }

  getVec3FromJSONShapeData(shapeData) {
    let vec3Array = [];

    for (let i = 0; i < shapeData.length; i++) {
      let vector3 = new THREE.Vector3(shapeData[i].x, shapeData[i].y, shapeData[i].z);
      vec3Array.push(vector3);
    }

    return vec3Array.reverse();
  }
}
