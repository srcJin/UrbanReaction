import * as THREE from 'three';
export const convertPtToTHREEVector = (pt) => {
  const { x, y, z } = pt;
  return new THREE.Vector3(x, y, z);
};

export const vector3ToShape = (vector) => {
  const { x, y, z } = vector;
  return { x, y, z };
};
