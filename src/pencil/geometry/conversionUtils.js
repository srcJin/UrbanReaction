import * as THREE from 'three';
/**
 * This function returns the vertices for a given BufferGeometry using position attribute
 *
 * @param geometry a BufferGeometry
 * @returns the vertices for a given BufferGeometry
 */
export const getVertices = (geometry) => {
  // This gets the array of all positions [x, y, z, x, y, z, x, y z,...]
  if (!geometry.getAttribute) {
    return [];
  }
  const positions = geometry.getAttribute('position');

  // This gets # of vertices
  const vertexCount = positions.count;

  const vertices = [];

  for (let i = 0; i < vertexCount; i += 1) {
    const singleVertex = new THREE.Vector3(positions.getX(i), positions.getY(i), positions.getZ(i));
    vertices.push(singleVertex);
  }

  return vertices;
};

/**
 * This function returns the normal for a given face of a BufferGeometry
 *
 * @param face the face the normal value should be calculated for
 * @param geometry a BufferGeometry
 * @returns normal value for the corresponding face
 */
export const getNormalForFace = (face, geometry) => {
  const vertices = getVertices(geometry);

  let normal = new THREE.Vector3();

  const tri = new THREE.Triangle(vertices[face.a], vertices[face.b], vertices[face.c]);
  tri.getNormal(normal);

  return normal;
};

/**
 * This function calculates and returns the normal values for each and every face of a given BufferGeometry
 *
 * @param geometry a BufferGeometry
 * @returns normal values for all the faces
 */
export const getCalculatedNormals = (geometry) => {
  const normals = [];

  if (geometry.index) {
    // is it indexed buffer geometryetry?
    const faceIds = geometry.getIndex();
    for (let i = 0; i < faceIds.count; i += 3) {
      let idx0 = faceIds.getX(i);
      let idx1 = faceIds.getX(i + 1);
      let idx2 = faceIds.getX(i + 2);

      const vertices = getVertices(geometry);

      let normal = new THREE.Vector3();

      const tri = new THREE.Triangle(vertices[idx0], vertices[idx1], vertices[idx2]);
      tri.getNormal(normal);

      normals.push(normal);
    }
  } else {
    const vertices = getVertices(geometry);

    for (let i = 0; i < vertices.length; i += 3) {
      let idx0 = i;
      let idx1 = i + 1;
      let idx2 = i + 2;

      let normal = new THREE.Vector3();
      const tri = new THREE.Triangle(vertices[idx0], vertices[idx1], vertices[idx2]);
      tri.getNormal(normal);
      normals.push(normal);
    }
  }

  return normals;
};

/**
 * This function returns all the faces for a given BufferGeometry
 *
 * @param geometry a BufferGeometry
 * @returns all the faces in the given BufferGeometry
 */
export const getFaces = (geometry) => {
  const faces = [];
  if (geometry.index) {
    // is it indexed buffer geometry?
    const faceIds = geometry.getIndex();
    for (let i = 0; i < faceIds.count; i += 3) {
      let idx0 = faceIds.getX(i);
      let idx1 = faceIds.getX(i + 1);
      let idx2 = faceIds.getX(i + 2);

      const vertices = geometry.vertices || getVertices(geometry); //getVertices(geometry);

      let normal = new THREE.Vector3();

      const tri = new THREE.Triangle(vertices[idx0], vertices[idx1], vertices[idx2]);
      tri.getNormal(normal);

      faces.push({
        a: idx0,
        b: idx1,
        c: idx2,
        triangle: tri,
        normal,
      });
    }
  } else {
    // This gets the array of all positions [x, y, z, x, y, z, x, y z,...]
    const positions = geometry.getAttribute('position');

    // This gets # of vertices
    const vertexCount = positions.count;

    const vertices = geometry.vertices || getVertices(geometry); // getVertices(geometry);

    for (let i = 0; i < vertexCount; i += 3) {
      let idx0 = i;
      let idx1 = i + 1;
      let idx2 = i + 2;

      let normal = new THREE.Vector3();

      const tri = new THREE.Triangle(vertices[idx0], vertices[idx1], vertices[idx2]);
      tri.getNormal(normal);

      faces.push({
        a: idx0,
        b: idx1,
        c: idx2,
        triangle: tri,
        normal,
      });
    }
  }

  return faces;
};

/**
 * This function returns the index of a given face from the given faces array
 *
 * @param faces the array of faces
 * @param face face to find the index
 * @returns the index of the given face
 */
export const getIndexOfFace = (faces, face) => {
  let res = -1;
  for (let i = 0; i < faces.length; i++) {
    const curFace = faces[i];
    if (curFace.a === face.a && curFace.b === face.b && curFace.c === face.c) {
      res = i;
      break;
    }
  }

  return res;
};

/**
 * This function finds the indices of the occurrences for a given vertex in the vertices
 *
 * @param v vertex that occurrences should be found
 * @param vertices array of vertices
 * @returns the indices of the occurrences of v in vertices
 */
export const getSameVertexIndices = (v, vertices) => {
  const res = [];
  for (let i = 0; i < vertices.length; i++) {
    if (vertices[i].equals(v)) {
      res.push(i);
    }
  }

  return res;
};

/**
 * This function changes the color of a given face in a BufferGeometry
 *
 * @param geometry a BufferGeometry
 * @param face face to change the color
 * @param color color code
 */
export const changeFaceColor = (geometry, face, color) => {
  const colors = geometry.getAttribute('color');
  if (colors) {
    colors.setX(face.a, color.r);
    colors.setY(face.a, color.g);
    colors.setZ(face.a, color.b);

    colors.setX(face.b, color.r);
    colors.setY(face.b, color.g);
    colors.setZ(face.b, color.b);

    colors.setX(face.c, color.r);
    colors.setY(face.c, color.g);
    colors.setZ(face.c, color.b);
  }
};

/**
 * This function retrieves the normal values from the normal attribute of a BufferGeomtry
 *
 * @param geometry a BufferGeomtry
 * @returns normal values from the attribute
 */
export const getNormals = (geometry) => {
  const normals = geometry.getAttribute('normal');

  if (normals) {
    const normalsCount = normals.count;

    const normalVectors = [];

    for (let i = 0; i < normalsCount; i += 1) {
      const singleNormal = new THREE.Vector3();
      singleNormal.set(normals.getX(i), normals.getY(i), normals.getZ(i));
      normalVectors.push(singleNormal);
    }

    return normalVectors;
  }

  return [];
};

/**
 * This function returns UV values from the uv attribute of a BufferGeometry
 *
 * @param geometry a BufferGeomtry
 * @returns uv values from the attribute
 */
export const getUVs = (geometry) => {
  const uvs = geometry.getAttribute('uv');

  const uvsCount = uvs.count;

  const uvValues = [];

  // Each loop counts up by 3
  for (let i = 0; i < uvsCount; i += 1) {
    uvValues.push({ u: uvs.getX(i), v: uvs.getY(i) });
  }

  return uvValues;
};

/**
 * This function creates a BufferGeometry for a given deprecated Geometry. This was taken from internet and modified.
 *
 * @param geometry a Geometry instance that needs to be converted to BufferGeometry
 * @returns a BufferGeometry for the given Geometry
 */
export const toBufferGeometry = (geometry) => {
  const vertexCount = geometry.vertices.length;
  const vertices = new Float32Array(vertexCount * 3); // 3 coordinates / vertex
  //copy vertices data : straightforward
  let vertexIncrement = 0;
  for (let i = 0; i < vertexCount; i++) {
    //vertexIncrement is incremented 3 times each time i is incremented by one
    vertices[vertexIncrement++] = geometry.vertices[i].x;
    vertices[vertexIncrement++] = geometry.vertices[i].y;
    vertices[vertexIncrement++] = geometry.vertices[i].z;
  }

  // now the structure of faces being what it is, retrieving indices is a bit more tricky:

  //get the face count
  const faceCount = geometry.faces.length;

  //create a buffer of length ( face count * 3 )
  const indices = new Uint32Array(faceCount * 3); // 3 indices / face

  //iterate over faces and stores the faces indices inside the indices buffer
  let indicesIncrement = 0;
  for (let i = 0; i < faceCount; i++) {
    const face = geometry.faces[i];
    const i0 = face.a; //index of vertex 0
    const i1 = face.b; //index of vertex 1
    const i2 = face.c; //index of vertex 2

    //console.log( i0, i1, i2 );//debug

    //indicesIncrement is incremented 3 times each time i (face iterator) is incremented by one
    indices[indicesIncrement++] = i0;
    indices[indicesIncrement++] = i1;
    indices[indicesIncrement++] = i2;
  }

  //retrieving uvs is a even trickier:
  //the vertices length = vertexCount * 3 and uvs length = vertexCount * 2
  const uvs = new Float32Array(vertexCount * 2); // 2 uvs / vertex

  //now the uv data is stored inside the geometry's facevertexUvs[ index of UV set ]
  //BUT the index of the uvs is stored in the geometry's face object (face.a, face.b, face.c )

  //we have to scan each uvs and store their values
  //and find where to push them in the uvs buffer

  const uvCount = geometry.faceVertexUvs[0].length;
  for (let i = 0; i < uvCount; i++) {
    //get the values of the uvs
    const faceUvs = geometry.faceVertexUvs[0][i];

    const uv0 = faceUvs[0]; //values of uvs 0
    const uv1 = faceUvs[1]; //values of uvs 1
    const uv2 = faceUvs[2]; //values of uvs 2
    //console.log( uv0, uv1, uv2 );// > THREE.Vector2 {x: 0, y: 1}, THREEE.Vector2 {x: 0, y: 0}, THREE.Vector2 {x: 1, y: 1}....

    //get the position of the uvs inside the uvs buffer: the index of the vertex they are associated to
    const face = geometry.faces[i];
    const i0 = face.a; //index of vertex & uvs 0
    const i1 = face.b; //index of vertex & uvs 1
    const i2 = face.c; //index of vertex & uvs 2

    //as the uvs are incremented 2 by 2 (their 'stride' is 2 ) we have to multiply the face index by 2
    const uv0index = i0 * 2;
    uvs[uv0index] = uv0.x;
    uvs[uv0index + 1] = uv0.y;

    const uv1index = i1 * 2;
    uvs[uv1index] = uv1.x;
    uvs[uv1index + 1] = uv1.y;

    const uv2index = i2 * 2;
    uvs[uv2index] = uv2.x;
    uvs[uv2index + 1] = uv2.y;

    //we have assigned the uvs values \o/
  }

  //now we have the 3 buffers ready, we can build a new BufferGeometry
  const bufferGeometry = new THREE.BufferGeometry();
  bufferGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  bufferGeometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  bufferGeometry.setIndex(new THREE.BufferAttribute(indices, 1));

  return bufferGeometry;
};

export const toBufferGeometry1 = (geometry) => {
  const bg = new THREE.BufferGeometry();

  let ver = [];

  for (let index = 0; index < geometry.vertices.length; index++) {
    ver.push(geometry.vertices[index].x);
    ver.push(geometry.vertices[index].y);
    ver.push(geometry.vertices[index].z);
  }

  const vertices = new Float32Array(ver);
  bg.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  return bg;
};
