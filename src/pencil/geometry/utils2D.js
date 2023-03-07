import * as THREE from 'three';
//import { Geometry } from 'three/examples/jsm/deprecated/Geometry';
import { Geometry, LineLoop, Line } from 'three_124';
import { defaultLineMaterial } from '../materials/public-materials';
import MeshLine from '../meshline';
export const utils2D = {
  scale: function (pList, scale, center) {
    const scaled = [];

    for (let pt of pList) {
      const dx = (pt.x - center.x) * scale.x;
      const dz = (pt.z - center.z) * scale.z;

      scaled.push(new THREE.Vector3(center.x + dx, pt.y, center.z + dz));
    }

    return scaled;
  },

  drawClosedLine: function (pList, material, translation, rotation, scale, centerPt) {
    let p_geom = new Geometry();
    if (pList) {
      p_geom.vertices.push(...JSON.parse(JSON.stringify(pList)));
    }
    material = material || defaultLineMaterial;

    if (rotation) {
      const SIN = Math.sin(-rotation.y);
      const COS = Math.cos(-rotation.y);
      const cp = centerPt;

      for (let p of p_geom.vertices) {
        const dx = p.x - cp.x;
        const dz = p.z - cp.z;

        p.x = dx * COS - dz * SIN + cp.x;
        p.z = dz * COS + dx * SIN + cp.z;
      }
    }

    if (scale) {
      const cp = centerPt;

      for (let p of p_geom.vertices) {
        let dx = (p.x - cp.x) * scale.x;
        let dz = (p.z - cp.z) * scale.z;

        p.x = cp.x + dx;
        p.z = cp.z + dz;
      }
    }

    if (translation) {
      for (let p of p_geom.vertices) {
        p.x += translation.x;
        p.y += translation.y;
        p.z += translation.z;
      }
    }

    return new LineLoop(p_geom, material);
  },

  drawOpenLine: function (pList, material) {
    let p_geom = new Geometry();
    p_geom.vertices.push(...pList);
    material = material || defaultLineMaterial;

    return new Line(p_geom, material);
  },

  drawClosedMeshLine: function (pList, material) {
    let p_geom = new Geometry();
    p_geom.vertices.push(...pList);
    material = material || defaultLineMaterial;

    var meshStroke = new MeshLine();
    meshStroke.setGeometry(p_geom);
    var mesh = new THREE.Mesh(meshStroke.geometry, material);

    return mesh;
  },

  setMeshLine: function (geometry, material, taper) {
    const line = new MeshLine();
    line.setGeometry(geometry);

    line.setGeometry(geometry, function (p) {
      return 2;
    });
    if (taper) {
      line.setGeometry(geometry, function (p) {
        return 1 - p;
      });
    }
    var mesh = new THREE.Mesh(line.geometry, material);
    return mesh;
  },
};
