import * as THREE from "three";

// from myMath.js
export function evaluateCrv(a, b, t) {
  // check on this thing..
  var mx = (b.x - a.x) * t;
  var my = (b.y - a.y) * t;
  var mz = (b.z - a.z) * t;
  return new THREE.Vector3(a.x + mx, a.y + my, a.z + mz);
}

export function checkLineIntersection(
  line1StartX,
  line1StartY,
  line1EndX,
  line1EndY,
  line2StartX,
  line2StartY,
  line2EndX,
  line2EndY
) {
  // if the lines intersect, the result contains the x and y of the intersection (treating the lines as infinite) and booleans for whether line segment 1 or line segment 2 contain the point
  var denominator,
    a,
    b,
    numerator1,
    numerator2,
    result = {
      x: null,
      y: null,
      onLine1: false,
      onLine2: false,
    };
  denominator =
    (line2EndY - line2StartY) * (line1EndX - line1StartX) -
    (line2EndX - line2StartX) * (line1EndY - line1StartY);
  if (denominator == 0) {
    return result;
  }
  a = line1StartY - line2StartY;
  b = line1StartX - line2StartX;
  numerator1 = (line2EndX - line2StartX) * a - (line2EndY - line2StartY) * b;
  numerator2 = (line1EndX - line1StartX) * a - (line1EndY - line1StartY) * b;
  a = numerator1 / denominator;
  b = numerator2 / denominator;

  // if we cast these lines infinitely in both directions, they intersect here:
  result.x = line1StartX + a * (line1EndX - line1StartX);
  result.y = line1StartY + a * (line1EndY - line1StartY);
  /*
          // it is worth noting that this should be the same as:
          x = line2StartX + (b * (line2EndX - line2StartX));
          y = line2StartX + (b * (line2EndY - line2StartY));
          */
  // if line1 is a segment and line2 is infinite, they intersect if:
  if (a > 0 && a < 1) {
    result.onLine1 = true;
  }
  // if line2 is a segment and line1 is infinite, they intersect if:
  if (b > 0 && b < 1) {
    result.onLine2 = true;
  }
  // if line1 and line2 are segments, they intersect if both of the above are true
  return result;
}

export function getDistance(x1, z1, x2, z2) {
  var distance = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(z1 - z2, 2));
  return distance;
}

export function getLineLength(x1, y1, x2, y2) {
    var nx = x2 - x1; // as vector
    var ny = y2 - y1;
    const len = Math.sqrt(nx * nx + ny * ny); // length of line
    return len;
  }