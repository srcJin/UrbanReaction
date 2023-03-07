import { Matrix4, Object3D } from 'three';
import * as THREE from 'three';
import _ from 'lodash';

let centerMatrix = new Matrix4();

export function GetMousePosition(event) {
  let x = (event.clientX / window.innerWidth) * 2 - 1;
  let y = -(event.clientY / window.innerHeight) * 2 + 1;
  return { x, y };
}

export function Select(params) {
  let { raycaster, mouse, camera, objects } = params;

  raycaster.setFromCamera(mouse, camera);

  let intersections = raycaster.intersectObjects(objects);

  if (intersections.length) {
    const intersects = intersections.map((i) => i.object);
    let INTERSECTED = intersects[0];
    return { intersects, INTERSECTED, intersections };
  }

  return { intersects: null, INTERSECTED: null };
}

export function ToggleHighlight(viewport, intersects, INTERSECTED) {
  if (intersects) {
    if (viewport.INTERSECTED != INTERSECTED) {
      if (viewport.INTERSECTED)
        viewport.INTERSECTED.material.emissive.setHex(viewport.INTERSECTED.material.emissive.setHex(0x000000)); //whats happening here lol?

      viewport.INTERSECTED = INTERSECTED;
      viewport.intersects = intersects;
      viewport.INTERSECTED.currentHex = viewport.INTERSECTED.material.emissive.getHex();
      viewport.INTERSECTED.material.emissive.setHex(0xff0000);
    }
  } else {
    viewport.INTERSECTED = null;
  }

  return viewport.INTERSECTED;
}

export function SelectGroup(selectionObject, transformControl) {
  // console.log('selectionObject:: ', selectionObject)
  //F080BF
  toggleHexColor(selectionObject, 0xff00ff); // active color
  // toggleHexColor(selectionObject, 0xf080bf); // active color
  // transformControl.attach(selectionObject);
}

export function SelectMesh(object, transformControl) {
  console.log('select mesh deprecated ');

  /*   console.log('select mesh')
    let { attachmentGuides } = transformControl
    toggleHexColor(object, 0x0000ff) // active color 
    object.geometry.computeBoundingBox()
    const center = object.geometry.boundingBox.getCenter(new THREE.Vector3())
    center.applyMatrix4(object.matrix)
    attachmentGuides.forObject.applyMatrix4(object.matrix)
    attachmentGuides.forObject.scale.set(1, 1, 1)
    attachmentGuides.forObject.rotation.set(0, (object.oobAngle * Math.PI / 180), 0)
    attachmentGuides.forObject.position.set(center.x, object.position.y, center.z)
    attachmentGuides.forObject.attach(object)
    transformControl.attach(attachmentGuides.forObject)


    // return attachmentGuides
*/
}

export function DeselectGroup(object, transformControl, viewport) {
  toggleHexColor(object, 0x000000); // active color
  RemoveSelectionGroup(object, viewport);
  // transformControl.detach();
}

export function DeselectMesh(object, transformControl) {
  console.warn('deselect mesh is deprecated. use deselect group instead');
}

export function RemoveSelectionGroup(group, viewport) {
  let { children } = group;
  viewport.editor.specimenCopy = _.cloneDeep(viewport.editor.state.specimen);
  viewport.editor.drawnElementsCopy = _.cloneDeep(viewport.editor.state.drawnElements);
  const destroy = { blocks: [], booleans: [], plots: [] };
  const destroyBlocks = [];
  const destroyPlots = [];

  const create = { blocks: {}, booleans: {}, plots: {} };
  const createBlocks = {};
  const createPlots = {};

  let transformNeeded = false;

  const matrix = group.matrix.clone();
  // console.log('centerMatrix:: ', centerMatrix)
  const transformation = matrix.clone().multiply(centerMatrix.clone().invert());

  children.forEach((child) => {
    //to revert plot transforms
    if (child.recipe?.type === 'plot') {
      child.applyMatrix4(matrix);
      child.applyMatrix4(transformation.clone().invert());
      return;
    }

    if (!matrix.equals(centerMatrix)) {
      transformNeeded = true;
    }

    child.applyMatrix4(matrix);

    if (child.recipe && transformNeeded) {
      if (child.recipe.type === 'block') {
        destroyBlocks.push(_.cloneDeep(child.recipe));
      }
      if (child.recipe.type === 'plot') {
        destroyPlots.push(_.cloneDeep(child.recipe));
      }
      const curBlock = viewport.editor.state.specimen.blocks[child.recipe.uuid];
      viewport.editor.modifier.transformBlocks({ block: curBlock, matrix: transformation });
      if (child.recipe.type === 'block') {
        createBlocks[child.recipe.uuid] = _.cloneDeep(child.recipe);
      }
      if (child.recipe.type === 'plot') {
        createPlots[child.recipe.uuid] = _.cloneDeep(child.recipe);
      }
    }

    // if (child.recipe && child.name === 'block') {
    //   model.modifier.transformBlocks({ block: child.recipe, matrix: transformation });
    // }

    // // console.log('Child is:: ', child)

    // if (child.recipe && child.name === 'boolean') {
    //   model.modifier.transformBooleans({ boolean: child.recipe, matrix: transformation });
    // }
  });

  if (transformNeeded && (destroyBlocks.length > 0 || destroyPlots.length > 0)) {
    if (destroyBlocks.length > 0) {
      destroy.blocks = destroyBlocks;
      create.blocks = createBlocks;
    }
    if (destroyPlots.length > 0) {
      destroy.plots = destroyPlots;
      create.plots = createPlots;
    }
    const item = viewport.editor.recordLastState(
      viewport.editor.specimenCopy,
      viewport.editor.drawnElementsCopy,
      null,
      create,
      destroy,
      ['destroy', 'specimen'],
      ['destroy', 'specimen']
    );
    viewport.editor.undoQueue.push(item);
    viewport.editor.updateDataPack = _.cloneDeep(item);
    viewport.editor.onSpecimenChange();
  }

  let tempObjects = [];
  children.forEach((child) => tempObjects.push(child));
  group.remove(...children);
  tempObjects.forEach((o) => {
    if (o.userData.parent) {
      o.userData.parent.parent.add(o);
    } else {
      viewport.scene.add(o);
    }
  });

  /*group.position.set(0, 0, 0);
    group.rotation.set(0, 0, 0);
    group.scale.set(1, 1, 1);*/

  group.matrix.identity();
  centerMatrix.identity();

  children = tempObjects;

  return { children, group };
}

function resetChildTransform(children, position, rotation, scale, group) {
  let { matrix } = group;

  const temp = centerMatrix.clone();
  const inverse = temp.invert();

  children.forEach((child) => {
    /*console.log('child rotation y:', child.rotation.y)

        child.rotation.y -= group.rotation.y  

        child.applyMatrix4(matrix)
        console.log('child rotation y::', child.rotation.y)

        child.position.x -= position.x;
        child.position.y -= position.y;
        child.position.z -= position.z;*/

    child.applyMatrix4(inverse);
  });

  // centerMatrix.identity()

  return children;

  /*       
    const center = object.geometry.boundingBox.getCenter(new THREE.Vector3())
    center.applyMatrix4(object.matrix)
    attachmentGuides.forObject.applyMatrix4(object.matrix)
    attachmentGuides.forObject.scale.set(1, 1, 1)
    attachmentGuides.forObject.rotation.set(0, (object.oobAngle * Math.PI / 180), 0)
    attachmentGuides.forObject.position.set(center.x, object.position.y, center.z)
    attachmentGuides.forObject.attach(object)
    transformControl.attach(attachmentGuides.forObject)

    */
}

export function CreateSelectionGroup(objects) {
  // console.log('Creating selection group:: ', objects)

  let rotation = GetAverageRotation(objects);
  let position = GetAveragePosition(objects);

  // console.log('Avg PosRot:: ', rotation, position)
  // if(!rotation.y) rotation.y = 0

  let group = new Object3D();

  let tempGroup = new THREE.Object3D();
  objects.forEach((o) => tempGroup.add(o));

  let box = new THREE.Box3().setFromObject(tempGroup);
  let center = new THREE.Vector3();
  box.getCenter(center);

  tempGroup.remove(...objects);

  group.position.copy(center);
  group.rotation.set(0, rotation.y, 0);

  group.updateMatrix();

  centerMatrix = group.matrix.clone();

  objects = resetChildTransform(objects, center, rotation, null, group);
  objects.forEach((object) => group.add(object));

  return group;
}

function GetAverageRotation(objects) {
  let angle = 0;
  let total = 0;

  objects.forEach((o) => {
    o.geometry.computeBoundingBox();

    // console.log('oob:: ', o.oobAngle)

    if (o.oobAngle !== undefined) {
      // we need accute component of angle

      let theta = o.oobAngle;

      if (theta > 90 && theta < 180) {
        theta -= 90;
      }

      angle += theta;
      total++;
    }
  });

  // console.log('rot calc:: ', angle, total )

  let average = ((angle / (total || 1)) * Math.PI) / 180;

  return new THREE.Vector3(0, average, 0);
}

function GetAverageScale() {}

function GetAveragePosition(objects) {
  let dx = 0;
  let dy = 0;
  let dz = 0;

  let l = objects.length;

  objects.forEach((o) => {
    let { x, y, z } = o.position;
    dx += x;
    dy += y;
    dz += z;
  });

  dx /= l;
  dy /= l;
  dz /= l;

  return new THREE.Vector3(dx, dy, dz);
}

export function Hover(params) {
  let { mouse, camera, objects, raycaster } = params;
  raycaster.setFromCamera(mouse, camera);
  let intersects = raycaster.intersectObjects(objects);
  return intersects.map((i) => i.object);
}

export function Highlight(params) {
  let { INTERSECTED, current } = params;

  if (!INTERSECTED) {
    if (current) {
      console.log('unhighlight current', current.currentHex);
      current.material.emissive.setHex(0x000000); // unlight previous selection
    }

    current = null;
    return current;
  }

  if (INTERSECTED != current) {
    // new object is highlighted
    if (current) {
      console.log('unhighlight current', current.currentHex);
      current.material.emissive.setHex(0x000000); // unlight previous selection
    }

    current = INTERSECTED; // highlight new selection
    current.currentHex = INTERSECTED.material.emissive.getHex();
    current.material.emissive.setHex(0xff0000);

    return current;
  }
}

export function toggleHexColor(object, hex) {
  if (object.children) object.children.forEach((child) => toggleHexColor(child, hex));
  if (object.material) {
    if (object.material.emissive) {
      object.material.emissive.setHex(hex);
    }
  }
  return object;
}
