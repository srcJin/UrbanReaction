import * as THREE from "three";
import { Line2 } from "three/addons/lines/Line2.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import { pointMaterialRed, bluePaint } from "./Materials.js";
import { getLineLength, evaluateCrv, checkLineIntersection } from "./myMath.js";
// from control points to Line2 curve
export function getCurve(controlPoints) {
  // Material
  let curveMaterial = new LineMaterial({
    color: 0xdd22aa,
    linewidth: 3,
  });
  // resolution will be calculated in renderer
  curveMaterial.resolution.set(window.innerWidth, window.innerHeight);

  // Position and THREE.Color Data
  const positions = [];
  const points = [];

  const spline = new THREE.CatmullRomCurve3(controlPoints);
  const divisions = Math.round(12 * controlPoints.length);
  const point = new THREE.Vector3();

  for (let i = 0, l = divisions; i < l; i++) {
    const t = i / l;
    spline.getPoint(t, point);
    positions.push(point.x, point.y, point.z);
    points.push(new THREE.Vector3(point.x, point.y, point.z))
  }

  // Line2 ( LineGeometry, LineMaterial )
  const curveGeometry = new LineGeometry();
  curveGeometry.setPositions(positions);

  let curve = new Line2(curveGeometry, curveMaterial);
  // curve.computeLineDistances();
  curve.scale.set(1, 1, 1);
  // console.log("spline=",spline);
  return {line2:curve, points:points};
}

export function getPolyline(
  pointList,
  isClosed,
  material = new LineMaterial({
    color: 0xdd22aa,
    linewidth: 3,
  })
) {
  // resolution will be calculated in renderer
  material.resolution.set(window.innerWidth, window.innerHeight);

  // Position and THREE.Color Data
  const positions = [];

  const point = new THREE.Vector3();

  // here I add 5 to y position
  for (let i = 0, l = pointList.length; i < l; i++) {
    positions.push(pointList[i].x, pointList[i].y+5, pointList[i].z);
    // if closed polyline, add the first point
  }

  if (isClosed) {
    positions.push(pointList[0].x, pointList[0].y+5, pointList[0].z);
    }

  // Line2 ( LineGeometry, LineMaterial )
  const geometry = new LineGeometry();
  geometry.setPositions(positions);

  let polyline = new Line2(geometry, material);
  // curve.computeLineDistances();
  polyline.scale.set(1, 1, 1);

  return polyline;
}

export function getStar(
  posX,
  posZ,
  size,
  material = new THREE.MeshBasicMaterial({ color: 0xaaaaff })
) {
  let shapedef = new THREE.Shape();

  let x = [];
  let y = [];

  for (let k = 1; k <= 5; k++) {
    x.push(Math.cos((2 * Math.PI * k) / 5 + Math.PI));
    y.push(Math.sin((2 * Math.PI * k) / 5 + Math.PI));
  }

  shapedef.moveTo(x[0], y[0]);
  shapedef.lineTo((x[0] + x[1]) * 0.3, (y[0] + y[1]) * 0.3);
  shapedef.lineTo(x[1], y[1]);
  shapedef.lineTo((x[1] + x[2]) * 0.3, (y[1] + y[2]) * 0.3);
  shapedef.lineTo(x[2], y[2]);
  shapedef.lineTo((x[2] + x[3]) * 0.3, (y[2] + y[3]) * 0.3);
  shapedef.lineTo(x[3], y[3]);
  shapedef.lineTo((x[3] + x[4]) * 0.3, (y[3] + y[4]) * 0.3);
  shapedef.lineTo(x[4], y[4]);
  shapedef.lineTo((x[4] + x[0]) * 0.3, (y[4] + y[0]) * 0.3);

  const starGeometry = new THREE.ShapeGeometry(shapedef);
  let starMesh = new THREE.Mesh(starGeometry, material);
  starMesh.rotation.x = -Math.PI / 2;
  starMesh.position.set(posX, 100, posZ);
  starMesh.scale.set(size, size, size);
  return starMesh;
}

// draw Attractor point
export function getCircle(
  posX,
  posZ,
  size,
  material
) {
  let circleGeometry = new THREE.CircleGeometry(1, 32);
  let circleMesh = new THREE.Mesh(circleGeometry, material);
  circleMesh.rotation.x = -Math.PI / 2;
  circleMesh.position.set(posX, 100, posZ);
  circleMesh.scale.set(size, size, size);
  return circleMesh;
}

export function getRectangle(
    posX,
    posZ,
    width,
    height,
    material
  ) {
    let planeGeometry = new THREE.PlaneGeometry(width, height);
    let planeMesh = new THREE.Mesh(planeGeometry, material);
    planeMesh.rotation.x = -Math.PI / 2;
    planeMesh.position.set(posX, 100, posZ);
    return planeMesh;
  }

// Draw individual point
export function getPoint(Vector3, wSize, wProgram ) {
  // console.log("getPoint");
  let geometry = new THREE.BufferGeometry(); //Declare a Geometry object
  const vertices = new Float32Array([Vector3.x, Vector3.y, Vector3.z]);
  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  // console.log("vertices=",vertices);
  // Spawn point model
  let material =  new THREE.PointsMaterial({
    color: 0xE42251,    //Set the color, default 0xFFFFFF
    vertexColors: false, //Define whether the material uses vertex color, the default is false ---If this option is set to true, the color attribute is invalid
    size: wSize*100,          //Define the size of the particles. The default is 1.0
    transparent: true,
    opacity: 1
  });

  let point = new THREE.Points(geometry, material);
  // console.log("point=",point);
  //Add the model to the scene
  return point;
}

export function setMesh(cell, height, material) {
  //console.log("mat=" , mat)

  if (material === undefined) {
    //     const mat_1 = new THREE.MeshPhongMaterial({
    //         color: 0x364f6b,
    //         transparent: false,
    //         opacity: 1,
    //     });
    //     const mat_2 = new THREE.MeshPhongMaterial({
    //         color: 0x3fc1c9,
    //         transparent: false,
    //         opacity: 1,
    //     });
    const material = new THREE.MeshPhongMaterial({
      color: 0xf5f5f5,
      transparent: false,
      opacity: 1,
    });
    //     const mat_4 = new THREE.MeshPhongMaterial({
    //         color: 0xfc5185,
    //         transparent: false,
    //         opacity: 1,
    //     });
    //     material = mat_3;
  }

  var extrudeSettings = {
    steps: 1,
    bevelEnabled: false, // no bevel, default is true
    depth: height, // height of extrusion //
  };

  var shape = getShape(cell);

  var geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geometry.rotateX(-Math.PI / 2);

  let mesh = new THREE.Mesh(geometry, material);
  mesh.side = THREE.DoubleSide;
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  mesh.scale.set(1, 1, 1);

  return mesh;
}

// returns a shape from an array of 2D points
export function getShape(cell) {
  var shape = new THREE.Shape();
  var o = cell[0]; // origin of the shape

  if (o) {
    shape.moveTo(o.x, -o.z);
    for (var i = 1; i < cell.length; i++) {
      // lines along the points
      var pt = cell[i];
      shape.lineTo(pt.x, -pt.z);
    }
    // last line
    shape.lineTo(o.x, -o.z);
    return shape;
  }
}


// disable rectangle boundary for now
// export function getBoundary(boundaryWidth, boundaryHeight) {
//     // draw Boundary

//     let boundaryGeometry = new LineGeometry();
//     let a = new THREE.Vector3(-boundaryWidth / 2,
//         0,
//         -boundaryHeight / 2)
//     let b = new THREE.Vector3(-boundaryWidth / 2,
//         0,
//         boundaryHeight / 2)
//     let c = new THREE.Vector3(boundaryWidth / 2,
//         0,
//         boundaryHeight / 2)
//     let d = new THREE.Vector3(boundaryWidth / 2,
//         0,
//         -boundaryHeight / 2,)

//     // Material
//     let boundaryMaterial = new LineMaterial({
//         color: 0xdd2222,
//         linewidth: 4,
//     });
//     // resolution will be calculated in renderer
//     boundaryMaterial.resolution.set(window.innerWidth, window.innerHeight);
//     let group = new THREE.Group()
//     group.add(getLine(a,b,boundaryMaterial))
//     group.add(getLine(b,c,boundaryMaterial))
//     group.add(getLine(c,d,boundaryMaterial))
//     group.add(getLine(d,a,boundaryMaterial))

//     return group;
// }

export function getBoundary(pointArray) {
  // draw Boundary
  // let boundaryGeometry = new LineGeometry();
  // let a = new THREE.Vector3(x1,0,y1)
  // let b = new THREE.Vector3(x2,0,y2)
  // let c = new THREE.Vector3(x3,0,y3)
  // let d = new THREE.Vector3(x4,0,y4)
  // // Material
  // let boundaryMaterial = new LineMaterial({
  //     color: 0xdd2222,
  //     linewidth: 4,
  // });
  // // resolution will be calculated in renderer
  // boundaryMaterial.resolution.set(window.innerWidth, window.innerHeight);
  // let group = new THREE.Group()
  // group.add(getLine(a,b,boundaryMaterial))
  // group.add(getLine(b,c,boundaryMaterial))
  // group.add(getLine(c,d,boundaryMaterial))
  // group.add(getLine(d,a,boundaryMaterial))
  // return group;
}




// function getShape(pList){
// 	var shape = new THREE.Shape();
// 	var o = pList[0]
// 	shape.moveTo(o.x, o.z)

// 	for (var i = 0; i < pList.length; i++) {
// 		var pt = pList[i]
// 		shape.lineTo(pt.x, pt.z)
// 	}

// 	shape.autoClose = true;

// 	return shape;
// }

// modified drawLine function from explorer.js
export function drawLine(a, b, off, material = bluePaint) {
  // console.log("drawLine");
  let points = [];
  points.push(new THREE.Vector3(a.x, off, a.z));
  points.push(new THREE.Vector3(b.x, off, b.z));
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const line = new THREE.Line(geometry, material);

  //scene.add(line)
  // var line = new THREE.CatmullRomCurve3(points)
  // scene.add( line );
  return line;
}

export function getLine(
  start,
  end,
  material = new LineMaterial({
    color: 0xdd22aa,
    linewidth: 3,
  })
) {
  // resolution will be calculated in renderer
  material.resolution.set(window.innerWidth, window.innerHeight);

  // Position and THREE.Color Data
  const positions = [];
  const point = new THREE.Vector3();

  positions.push(start.x, start.y, start.z);
  positions.push(end.x, end.y, end.z);

  // Line2 ( LineGeometry, LineMaterial )
  const geometry = new LineGeometry();
  geometry.setPositions(positions);

  let line = new Line2(geometry, material);
  line.scale.set(1, 1, 1);

  return line;
}

