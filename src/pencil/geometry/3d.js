import {
  Shape,
  Vector3,
  ExtrudeGeometry,
  Mesh,
  EdgesGeometry,
  BoxGeometry,
  LineSegments,
  LineCurve,
  MeshStandardMaterial,
  CatmullRomCurve3,
  Vector2,
} from 'three';
import { getOffset } from '../clipper/clipper-tools.js';

import {
  getVectorBetweenPoints,
  distance,
  mapRange,
  angleBetweenVectorAndXaxis,
} from '../math/math-tools.js';
import { convertPtToTHREEVector } from '../boundary/utils';
import { ProfiledContourGeometry } from './ProfiledContourGeometry';

const { PI, sin, cos, acos, asin } = Math;

function rad(angle) {
  return (angle * PI) / 180;
}

export function extrudeBlock({ shape, volume, holes, floors, f2f, translation }) {
  let depth = f2f * floors;
  if (!shape?.length) return null;
  const object = getShape(shape);

  if (holes) {
    if (holes.length) {
      for (const hole of holes) {
        if (hole.length) {
          object.holes.push(getShape(hole.reverse()));
        }
      }
    }
  }

  const geometry = new ExtrudeGeometry(object, { depth, bevelEnabled: false });
  geometry.rotateX(-Math.PI / 2);
  if (translation) geometry.translate(translation.x, translation.y, translation.z);
  const mesh = new Mesh(geometry);
  return mesh;
}

//Sets the Uvs of the plot mesh top & bottom faces in the domain 0-1 based on mesh bounding box
export function setPlotMeshUVbyBbox(mesh) {
  let geometry = mesh.geometry;

  //as plot mesh geometry was created with extruded geometry rotated by X -math.Pi, we need to rotate it's
  //the bounding box to opposite direction to get a proper UVs - let's create a copy of mesh geo and rotate it properly
  let geometryClone = geometry.clone();
  geometryClone.rotateX(Math.PI);
  geometryClone.computeBoundingBox(); // compute bounding box
  let bbox = geometryClone.boundingBox;
  geometryClone.dispose();

  //let's remap uvs of the mesh top and bottom faces of extruded geometry to 0-1 domain based on rotated bbox
  //to find top faces let's use the normals and select only those with normals = 1 && - 1 on Y axis
  const uvAttribute = geometry.attributes.uv;
  const normalAttribute = geometry.attributes.normal;
  let count = uvAttribute.count;

  for (let i = 0; i < count; i++) {
    let un;
    let vn;

    let yNormal = normalAttribute.getY(i);

    if (yNormal == 1 || yNormal == -1) {
      let u = uvAttribute.getX(i);
      let v = uvAttribute.getY(i);

      un = mapRange(u, bbox.min.x, bbox.max.x, 0, 1);
      vn = mapRange(v, bbox.min.z, bbox.max.z, 0, 1);
    } else {
      un = 0;
      vn = 0;
    }

    uvAttribute.setXY(i, un, vn);
  }

  geometry.attributes.uv.needsUpdate = true;
}

function profile({ line, translation, depth, material, scale, rotation, angle, flipY }) {
  const ang = rad(angle);

  // console.log('FlipY: ', flipY)

  const flip = flipY ? 1 : -1;

  const v1 = new Vector3();
  const v2 = v1.clone().add(new Vector3(-1 * depth * acos(ang), 0, 0));
  const v3 = v1.clone().add(new Vector3(0, 0, flip * depth * asin(ang)));

  const shape = getShape([v1, v2, v3]);

  const pt1 = line[0],
    pt2 = line[1];

  const dist = distance(pt1, pt2);
  const vec = getVectorBetweenPoints(pt1, pt2);
  const rotY = Math.atan2(vec.x, vec.z);

  const geometry = new ExtrudeGeometry(shape, { depth: dist, bevelEnabled: false });
  // geometry.rotateZ(Math.PI)
  geometry.rotateY(rotY);

  geometry.translate(translation.x, translation.y, translation.z);
  geometry.translate(pt1.x, 0, pt1.z);

  const extrusion = new Mesh(geometry, material);

  return extrusion;
}

function taperMany({ polygon, translation, depth, material, scale, rotation, angle, flipY }) {
  const extrusions = [];

  const ang = rad(angle);

  const flip = flipY ? 1 : -1;

  const v1 = new Vector3();
  const v2 = v1.clone().add(new Vector3(-1 * depth * acos(ang), 0, 0));
  const v3 = v1.clone().add(new Vector3(0, 0, flip * depth * asin(ang)));

  const shape = getShape([v1, v2, v3]);

  for (var i = 0; i < polygon.length; i++) {
    const pt1 = polygon[i],
      pt2 = polygon[(i + 1) % polygon.length];

    const dist = distance(pt1, pt2);
    const vec = getVectorBetweenPoints(pt1, pt2);
    const rotY = Math.atan2(vec.x, vec.z);

    const geometry = new ExtrudeGeometry(shape, { depth: dist, bevelEnabled: false });
    // geometry.rotateZ(Math.PI)
    geometry.rotateY(rotY);

    geometry.translate(translation.x, translation.y, translation.z);
    geometry.translate(pt1.x, 0, pt1.z);

    const extrusion = new Mesh(geometry, material);

    extrusions.push(extrusion);
  }

  return extrusions;
}

function box({ origin, length, width, translation, height, rotation, material }) {
  const geometry = new BoxGeometry(width, height, length);

  geometry.translate(0, height / 2, 0);
  geometry.translate(translation.x, translation.y, translation.z);

  if (rotation) {
    geometry.rotateX(rotation.x);
    geometry.rotateY(rotation.y);
    geometry.rotateZ(rotation.z);
  }

  const mesh = new Mesh(geometry, material.clone());

  if (origin) mesh.position.set(origin.x, origin.y, origin.z);

  return mesh;
}

function boxes({ origin, length, width, translation, height, rotation, material, randomizeHeight }) {
  const meshes = [];

  for (const pt of origin) {
    const geometry = new BoxGeometry(width, height, length);

    // console.log('randomizeHeight:: ', randomizeHeight)

    const y = randomizeHeight ? Math.round(Math.random() * 6) * 6 : translation.y;

    geometry.translate(0, height / 2, 0);
    geometry.translate(translation.x, y, translation.z);

    if (rotation) {
      geometry.rotateX(rotation.x);
      geometry.rotateY(rotation.y);
      geometry.rotateZ(rotation.z);
    }

    const mesh = new Mesh(geometry, material.clone());

    if (pt) mesh.position.set(pt.x, pt.y, pt.z);

    meshes.push(mesh);
  }

  return meshes;
}

function extrude({ polygon, holes, depth, translation, scale, rotation, material, uuid }) {
  if (!polygon.length) {
    return null;
  }

  const shape = getShape(polygon);

  if (holes) {
    if (holes.length) {
      for (const hole of holes) {
        if (hole.length) {
          shape.holes.push(getShape(hole.reverse()));
        }
      }
    }
  }

  const geometry = new ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  geometry.rotateX(-Math.PI / 2);

  /*if (rotation) {
        geometry.rotateX(rotation.x)
        geometry.rotateY(rotation.y)
        geometry.rotateZ(rotation.z)
    }*/

  // if(translation) geometry.translate(translation.x, translation.y, translation.z)
  // if(scale) geometry.scale(scale.x, scale.y, scale.z)

  const mesh = new Mesh(geometry, material ? material.clone() : new MeshStandardMaterial());

  if (rotation) {
    mesh.rotateX(rotation.x);
    mesh.rotateY(rotation.y);
    mesh.rotateZ(rotation.z);
  }

  if (scale) mesh.scale(scale.x, scale.y, scale.z);
  if (translation) mesh.position.set(translation.x, translation.y, translation.z);

  // if (scale) mesh.scale.set(scale.x, scale.y, scale.z)

  if (uuid) mesh.uuid = uuid;

  return mesh;
}

function getShape(cell) {
  const shape = new Shape();
  const o = cell[0];

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

function getEdges(mesh, material) {
  const geometry = new EdgesGeometry(mesh.geometry);
  const edges = new LineSegments(geometry, material);

  return edges;
}

function dispose(object, recurive) {
  if (!object) {
    return;
  }

  if (object.geometry) object.geometry.dispose();

  if (object.material) {
    if (object.material.map) object.material.map.dispose();
    object.material.dispose();
  }

  if (recurive) {
    object.children.forEach((child) => dispose(child, true));
  }
}

function extrudeAlongPolyline({ shape, polyline }) {
  shape = getShape(shape);
  const profileShape = polyline.map((pt) => new Vector2(pt.x, pt.z));
  /* polyline = polyline.map((pt) => convertPtToTHREEVector(pt));
  const path = new CatmullRomCurve3(polyline);
  path.curveType = 'centripetal';
  path.closed = false;
  const extrudeSettings = {
    steps: 25,
    bevelEnabled: false,
    extrudePath: path,
  }; */
  const geometry = ProfiledContourGeometry(shape, profileShape, false, false);
  geometry.computeBoundingBox();
  // geometry.attributes.uv.needsUpdate = true;
  // const geometry = new ExtrudeGeometry(shape, extrudeSettings);
  const mesh = new Mesh(geometry, new MeshStandardMaterial({ color: 0x333333, flatShading: true }));
  console.log('Got geometry:: ', geometry, mesh);
  return mesh;
}

export { box, boxes, extrude, extrudeAlongPolyline, profile, getEdges, dispose };

/*for (var i = 0; i < len-1; i++) {
        
        positions.push( 
            polygon[i].x, polygon[i].y, polygon[i].z, 
            offset[i].x, offset[i].y, offset[i].z, 
            offset[i+1].x, offset[i+1].y, offset[i+1].z, 
        );
        positions.push( 
            polygon[i+1].x, polygon[i+1].y, polygon[i+1].z, 
            polygon[i].x, polygon[i].y, polygon[i].z, 
            offset[i+1].x, offset[i+1].y, offset[i+1].z, 
        );
    }

    geometry.setAttribute( 'position', new Float32BufferAttribute( positions, 3 ) );
    geometry.computeVertexNormals();*/
