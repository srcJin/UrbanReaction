import * as THREE from 'three';
import { getFaces, getSameVertexIndices, getVertices } from '../geometry/conversionUtils';

export class faceUtils {
  getCoplanar(maxAngle, geometry, face, clamp, out, originFace) {
    if (clamp === undefined) {
      clamp = true;
    }
    if (this.originFace === undefined) {
      this.originFace = face;
    }
    if (this.pendingRecursive === undefined) {
      this.pendingRecursive = 0;
    }
    this.result = out;
    if (out === undefined) {
      this.result = { count: 0 };
    }
    if (geometry.vertexHash === undefined) {
      faceUtils.vertexHash(geometry);
    }
    this.pendingRecursive++;
    const vertexes = ['a', 'b', 'c'];
    for (const i in vertexes) {
      const vertexIndex = face[vertexes[i]];
      const adjacentFaces = geometry.vertexHash[vertexIndex];
      for (const a in adjacentFaces) {
        const newface = adjacentFaces[a];
        let testF = this.originFace;
        if (clamp === false) {
          testF = face;
        }
        //var facesShareEdge = faceUtils.getFaceBoundigBox(testF, geometry).equals(faceUtils.getFaceBoundigBox(newface, geometry))

        //if ((testF.normal.angleTo(newface.normal) * (180 / Math.PI) <= maxAngle) && facesShareEdge) {
        if (testF.normal.angleTo(newface.normal) * (180 / Math.PI) <= maxAngle) {
          if (this.result['f' + newface.a + newface.b + newface.c] === undefined) {
            this.result['f' + newface.a + newface.b + newface.c] = newface;
            this.result.count++;
            this.getCoplanar(maxAngle, geometry, newface, clamp, this.result, this.originFace);
          }
        }
      }
    }
    this.pendingRecursive--;

    if (this.pendingRecursive === 0 && this.onCoplanar != undefined) {
      delete this.result.count;
      this.onCoplanar(this.result);
    }
  }

  getClosestFaceToPointWithinDistance(faces, point, maxDistance) {
    let face = null;
    var minDistance = 1e9;

    for (let i = 0; i < faces.length; i++) {
      let closestPointOnFace = new THREE.Vector3();
      faces[i].triangle.closestPointToPoint(point, closestPointOnFace);
      let distance = closestPointOnFace.distanceTo(point);
      if (distance < minDistance && distance < maxDistance) {
        minDistance = distance;
        face = faces[i];
      }
    }

    return face;
  }

  getFaceByNormal(faces, normal) {
    let epsilon = 0.0001;

    let face = null;
    for (let i = 0; i < faces.length; i++) {
      let xDelta = Math.abs(faces[i].normal.x - normal.x);
      let yDelta = Math.abs(faces[i].normal.y - normal.y);
      let zDelta = Math.abs(faces[i].normal.z - normal.z);

      let delta = xDelta + yDelta + zDelta;
      if (delta < epsilon) {
        face = faces[i];
        return face;
      }
    }
    return face;
  }

  static vertexHash(geometry) {
    geometry.vertexHash = [];

    const vertices = getVertices(geometry);
    geometry.vertices = vertices;
    const faces = getFaces(geometry, vertices);
    const vLen = vertices.length;
    for (let i = 0; i < vLen; i++) {
      geometry.vertexHash[i] = [];
      const sameVertices = getSameVertexIndices(vertices[i], vertices, i);
      for (const f in faces) {
        if (
          sameVertices.includes(faces[f].a) ||
          sameVertices.includes(faces[f].b) ||
          sameVertices.includes(faces[f].c)
        ) {
          geometry.vertexHash[i].push(faces[f]);
        }
        // if (faces[f].a === i || faces[f].b === i || faces[f].c === i) {
        //   geometry.vertexHash[i].push(faces[f]);
        // }
      }
    }
  }

  static getFaceBoundigBox(face, geometry) {
    const vertices = getVertices(geometry);
    const va1 = vertices[face.a];
    const vb1 = vertices[face.b];
    const vc1 = vertices[face.c];

    const faceGeometry = new THREE.BufferGeometry();
    const faceVertices = new Float32Array([va1.x, va1.y, va1.z, vb1.x, vb1.y, vb1.z, vc1.x, vc1.y, vc1.z]);

    // itemSize = 3 because there are 3 values (components) per vertex
    faceGeometry.setAttribute('position', new THREE.BufferAttribute(faceVertices, 3));
    // faceGeometry.vertices.push(va1, vb1, vc1);
    faceGeometry.computeBoundingBox();

    return faceGeometry.boundingBox;
  }

  static computeNewBoxProjectedUVs(geometry, transformMatrix, f2f) {
    //find out the dimensions, to let texture size 100% fit without stretching
    let uvMapSize = f2f;

    applyBoxUV(geometry, new THREE.Matrix4().copy(transformMatrix).invert(), uvMapSize);
  }

  // static computeNewBoxProjectedUVs(mesh) {
  //   //find out the dimensions, to let texture size 100% fit without stretching
  //   let bufferGeometry = mesh.geometry;
  //   bufferGeometry.computeBoundingBox();

  //   let sizes = new THREE.Vector3();
  //   bufferGeometry.boundingBox.getSize(sizes);

  //   let uvMapSize = Math.max(sizes.x, sizes.y, sizes.z);

  //   let matrixCopy = new THREE.Matrix4();
  //   matrixCopy.copy(mesh.matrix);
  //   let transformMatrix = matrixCopy.invert();

  //   applyBoxUV(bufferGeometry, transformMatrix, uvMapSize);
  // }
}

//maps 3 verts of 1 face on the better side of the cube
//side of the cube can be XY, XZ or YZ
const makeUVs = (v0, v1, v2, transformMatrix, bbox, bbox_max_size) => {
  //pre-rotate the model so that cube sides match world axis
  v0.applyMatrix4(transformMatrix);
  v1.applyMatrix4(transformMatrix);
  v2.applyMatrix4(transformMatrix);

  //get normal of the face, to know into which cube side it maps better
  let n = new THREE.Vector3();
  n.crossVectors(v1.clone().sub(v0), v1.clone().sub(v2)).normalize();

  n.x = Math.abs(n.x);
  n.y = Math.abs(n.y);
  n.z = Math.abs(n.z);

  let uv0 = new THREE.Vector2();
  let uv1 = new THREE.Vector2();
  let uv2 = new THREE.Vector2();
  // xz mapping
  if (n.y > n.x && n.y > n.z) {
    // uv0.x = (v0.x - bbox.min.x) / bbox_max_size;
    // uv0.y = (bbox.max.z - v0.z) / bbox_max_size;
    // uv1.x = (v1.x - bbox.min.x) / bbox_max_size;
    // uv1.y = (bbox.max.z - v1.z) / bbox_max_size;
    // uv2.x = (v2.x - bbox.min.x) / bbox_max_size;
    // uv2.y = (bbox.max.z - v2.z) / bbox_max_size;
  } else if (n.x > n.y && n.x > n.z) {
    uv0.x = (v0.z - bbox.min.z) / bbox_max_size;
    uv0.y = (v0.y - bbox.min.y) / bbox_max_size;

    uv1.x = (v1.z - bbox.min.z) / bbox_max_size;
    uv1.y = (v1.y - bbox.min.y) / bbox_max_size;

    uv2.x = (v2.z - bbox.min.z) / bbox_max_size;
    uv2.y = (v2.y - bbox.min.y) / bbox_max_size;
  } else if (n.z > n.y && n.z > n.x) {
    uv0.x = (v0.x - bbox.min.x) / bbox_max_size;
    uv0.y = (v0.y - bbox.min.y) / bbox_max_size;

    uv1.x = (v1.x - bbox.min.x) / bbox_max_size;
    uv1.y = (v1.y - bbox.min.y) / bbox_max_size;

    uv2.x = (v2.x - bbox.min.x) / bbox_max_size;
    uv2.y = (v2.y - bbox.min.y) / bbox_max_size;
  }

  return {
    uv0: uv0,
    uv1: uv1,
    uv2: uv2,
  };
};

const _applyBoxUV = (geom, transformMatrix, bbox, bbox_max_size) => {
  let coords = [];
  coords.length = (2 * geom.attributes.position.array.length) / 3;

  // geom.removeAttribute('uv');
  if (geom.attributes.uv === undefined) {
    geom.addAttribute('uv', new THREE.Float32BufferAttribute(coords, 2));
  }

  if (geom.index) {
    // is it indexed buffer geometry?
    for (let vi = 0; vi < geom.index.array.length; vi += 3) {
      let idx0 = geom.index.array[vi];
      let idx1 = geom.index.array[vi + 1];
      let idx2 = geom.index.array[vi + 2];

      let vx0 = geom.attributes.position.array[3 * idx0];
      let vy0 = geom.attributes.position.array[3 * idx0 + 1];
      let vz0 = geom.attributes.position.array[3 * idx0 + 2];

      let vx1 = geom.attributes.position.array[3 * idx1];
      let vy1 = geom.attributes.position.array[3 * idx1 + 1];
      let vz1 = geom.attributes.position.array[3 * idx1 + 2];

      let vx2 = geom.attributes.position.array[3 * idx2];
      let vy2 = geom.attributes.position.array[3 * idx2 + 1];
      let vz2 = geom.attributes.position.array[3 * idx2 + 2];

      let v0 = new THREE.Vector3(vx0, vy0, vz0);
      let v1 = new THREE.Vector3(vx1, vy1, vz1);
      let v2 = new THREE.Vector3(vx2, vy2, vz2);

      let uvs = makeUVs(v0, v1, v2, transformMatrix, bbox, bbox_max_size);

      coords[2 * idx0] = uvs.uv0.x;
      coords[2 * idx0 + 1] = uvs.uv0.y;

      coords[2 * idx1] = uvs.uv1.x;
      coords[2 * idx1 + 1] = uvs.uv1.y;

      coords[2 * idx2] = uvs.uv2.x;
      coords[2 * idx2 + 1] = uvs.uv2.y;
    }
  } else {
    for (let vi = 0; vi < geom.attributes.position.array.length; vi += 9) {
      let vx0 = geom.attributes.position.array[vi];
      let vy0 = geom.attributes.position.array[vi + 1];
      let vz0 = geom.attributes.position.array[vi + 2];

      let vx1 = geom.attributes.position.array[vi + 3];
      let vy1 = geom.attributes.position.array[vi + 4];
      let vz1 = geom.attributes.position.array[vi + 5];

      let vx2 = geom.attributes.position.array[vi + 6];
      let vy2 = geom.attributes.position.array[vi + 7];
      let vz2 = geom.attributes.position.array[vi + 8];

      let v0 = new THREE.Vector3(vx0, vy0, vz0);
      let v1 = new THREE.Vector3(vx1, vy1, vz1);
      let v2 = new THREE.Vector3(vx2, vy2, vz2);

      let uvs = makeUVs(v0, v1, v2, transformMatrix, bbox, bbox_max_size);

      let idx0 = vi / 3;
      let idx1 = idx0 + 1;
      let idx2 = idx0 + 2;

      coords[2 * idx0] = uvs.uv0.x;
      coords[2 * idx0 + 1] = uvs.uv0.y;

      coords[2 * idx1] = uvs.uv1.x;
      coords[2 * idx1 + 1] = uvs.uv1.y;

      coords[2 * idx2] = uvs.uv2.x;
      coords[2 * idx2 + 1] = uvs.uv2.y;
    }
  }

  geom.attributes.uv.array = new Float32Array(coords);
  geom.attributes.uv.needsUpdate = true;
};

const applyBoxUV = (geometry, transformMatrix, boxSize) => {
  if (transformMatrix === undefined) {
    transformMatrix = new THREE.Matrix4();
  }

  if (boxSize === undefined) {
    let geom = geometry;
    geom.computeBoundingBox();
    let bbox = geom.boundingBox;

    let bbox_size_x = bbox.max.x - bbox.min.x;
    let bbox_size_z = bbox.max.z - bbox.min.z;
    let bbox_size_y = bbox.max.y - bbox.min.y;

    boxSize = Math.max(bbox_size_x, bbox_size_y, bbox_size_z);
  }

  let uvBbox = new THREE.Box3(
    new THREE.Vector3(-boxSize / 2, -boxSize / 2, -boxSize / 2),
    new THREE.Vector3(boxSize / 2, boxSize / 2, boxSize / 2)
  );

  _applyBoxUV(geometry, transformMatrix, uvBbox, boxSize);
};
