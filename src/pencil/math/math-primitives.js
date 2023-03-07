import { Vector3 } from 'three';
import { thicken } from '../clipper/clipper-tools';
import { selectRandom } from '../geometry/utils';
import { dotProduct, getNormalToVector, lerp, lineNormal, rad, rotateVector2D } from './math-tools';

const axisX = new Vector3(1, 0, 0);
const axisZ = new Vector3(0, 0, 1);
const position2D = new Vector3();

export function getRandomFShape() {
  let fShape;
  const nodeShape = selectRandom(['makeCircle2D', 'makeRectangle2D', 'makeFlower2D']);

  switch (nodeShape) {
    case 'makeCircle2D':
      fShape = makeCircle2D;
      break;
    case 'makeRectangle2D':
      fShape = makeRectangle2D;
      break;
    case 'makeFlower2D':
      fShape = makeFlower2D;
      break;
    default:
      break;
  }
  return fShape;
}

export function makeCircle2D({ position, radius, nPoints, angle }) {
  position = position || new Vector3();
  radius = radius || 8;
  nPoints = nPoints || 16;
  angle = rad(angle) || 0;

  const points = [];
  const angleDelta = (2 * Math.PI) / nPoints;

  for (let i = 0; i < nPoints; i++) {
    const pt = rotateVector2D(axisX.clone().multiplyScalar(radius), angle + angleDelta * i, true);
    pt.add(position);
    points.push(pt);
  }

  return points.reverse();
}

export function makeRectangle2D({ position, x, y, angle }) {
  position = position || new Vector3();
  x = x || 10;
  y = y || 10;
  angle = angle || 0;

  const points = [
    new Vector3(-x / 2, 0, -y / 2),
    new Vector3(-x / 2, 0, y / 2),
    new Vector3(x / 2, 0, y / 2),
    new Vector3(x / 2, 0, -y / 2),
  ];

  return points.map((pt) => rotateVector2D(pt, angle, false).add(position));
}

export function makeFlower2D({ position, radius, nPetals, amplitude, res }) {
  res = res || 50;
  nPetals = nPetals || 3;
  amplitude = amplitude || 3;
  radius = radius || 12;

  const dAngle = (2 * Math.PI) / res;
  const points = [];

  for (let i = 0; i < res; i++) {
    const dist = radius + amplitude * Math.sin(nPetals * dAngle * i);
    const dir = new Vector3(1, 0, 0);
    const pt = rotateVector2D(dir, dAngle * i, true);
    pt.multiplyScalar(dist);
    pt.add(position);
    points.push(pt);
  }
  return points;
}

export function makeRectangle2Dbetween2Points({ pt1, pt2, depth, alignment }) {
  alignment = alignment || 'mid';
  depth = depth || 6;
  let rectangle = [];
  const normal = lineNormal(pt1, pt2);

  switch (alignment) {
    case 'mid':
      normal.multiplyScalar(depth / 2);
      rectangle.push(
        pt1.clone().add(normal),
        pt1.clone().sub(normal),
        pt2.clone().sub(normal),
        pt2.clone().add(normal)
      );
      break;
    case 'inside':
      normal.multiplyScalar(depth);
      rectangle.push(pt1, pt1.clone().add(normal), pt2.clone().add(normal), pt2);
      break;
    case 'outside':
      normal.multiplyScalar(depth);
      rectangle.push(pt1, pt1.clone().sub(normal), pt2.clone().sub(normal), pt2);
      break;
    default:
      break;
  }
  return rectangle;
}

export function makeArc2Dbetween2Points({ pt1, pt2, u, v, radius }) {
  // console.log('Pts are:: ', pt1, pt2);
  const flip = -1;
  const resolution = 10;
  const normal = lineNormal(pt1, pt2);
  const length = pt1.distanceTo(pt2);
  const center = lerp(pt1, pt2, u);
  const offset = normal.clone().multiplyScalar(length * v * -flip);
  // console.log('Arc params:: ', { length, u, v, offset });

  center.add(offset);
  const shape = [];

  shape.push(pt1.clone());

  for (let i = 0; i < resolution + 1; i++) {
    const fac = i / resolution;
    const arcPt = lerp(pt1, pt2, fac);
    arcPt.add(offset);
    const distToCenter = arcPt.distanceTo(center);
    // console.log('Arc DistToCenter:: ', { distToCenter, arcPt, center, offset });

    const y = Math.sqrt(radius * radius - distToCenter * distToCenter);
    arcPt.add(normal.clone().multiplyScalar(y * flip));
    shape.push(arcPt);
  }

  shape.push(pt2.clone());

  // console.log('Arc Shape:: ', shape);

  return shape;
}

export function thickenPolyline({ polyline, depth, fillet }) {
  const shape = thicken(polyline, (depth * 10) / 2);
  return shape;
}

export function offsetPipe(polyline, depth) {
  return thicken(polyline, depth * 5, null, true, 100);
}

export function offsetPipeButt(polyline, depth) {
  return thicken(polyline, depth * 5, null, true, 100);
}

export function offsetPipeSquare(polyline, depth) {
  return thicken(polyline, depth * 5, null, false, 100);
}

export function offsetOpen(polyline, dist) {
  const offset = [];
  // 1. calculate normals
  const nPts = polyline.length;
  const normals = getNormals(polyline);
  // 2. calculate bisectors for except the endpoints
  const bisectors = getBisectors(normals);
  // 3. find offsetted points
  const startPt = polyline[0].clone().add(normals[0].clone().multiplyScalar(dist));
  offset.push(startPt);
  const endPt = polyline[nPts - 1].clone().add(normals[nPts - 2].clone().multiplyScalar(dist));

  for (let i = 1; i < nPts - 1; i++) {
    const delta = dist / Math.sqrt((1 + dotProduct(normals[i - 1], normals[i])) / 2);
    const pt = bisectors[i - 1].clone().multiplyScalar(delta).add(polyline[i]);
    offset.push(pt);
  }

  offset.push(endPt);

  return offset;
}
function getNormals(polyline, closed) {
  const normals = [];
  const nPts = polyline.length;
  const num = closed ? nPts : nPts - 1;

  for (let i = 0; i < num; i++) {
    const a = polyline[i % nPts],
      b = polyline[(i + 1) % nPts];
    const dir = b.clone().sub(a);
    const normal = getNormalToVector(dir);
    normals.push(normal);
  }

  return normals;
}

function getBisectors(normals, closed) {
  const bisectors = [];
  const num = closed ? normals.length : normals.length - 1;
  for (let i = 0; i < num; i++) {
    const na = normals[i].clone();
    const nb = normals[(i + 1) % normals.length].clone();
    const bisector = na.clone().add(nb);
    bisector.normalize();
    bisectors.push(bisector);
  }
  return bisectors;
}
