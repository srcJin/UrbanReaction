function lineToLine(x1, y1, x2, y2, x3, y3, x4, y4) {
  var s1_x = x2 - x1;
  var s1_y = y2 - y1;
  var s2_x = x4 - x3;
  var s2_y = y4 - y3;
  var s = (-s1_y * (x1 - x3) + s1_x * (y1 - y3)) / (-s2_x * s1_y + s1_x * s2_y);
  var t = (s2_x * (y1 - y3) - s2_y * (x1 - x3)) / (-s2_x * s1_y + s1_x * s2_y);
  return s >= 0 && s <= 1 && t >= 0 && t <= 1;
}

function linePolygon(x1, y1, x2, y2, points, tolerance) {
  var length = points.length;

  // check if first point is inside the shape (this covers if the line is completely enclosed by the shape)
  if (polygonPoint(points, x1, y1, tolerance)) {
    return true;
  }

  // check for intersections for all of the sides
  for (var i = 0; i < length; i += 2) {
    var j = (i + 2) % length;
    if (lineLine(x1, y1, x2, y2, points[i], points[i + 1], points[j], points[j + 1])) {
      return true;
    }
  }
  return false;
}

/**
 * line-line collision
 * from http://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect
 * @param {number} x1 first point in line 1
 * @param {number} y1 first point in line 1
 * @param {number} x2 second point in line 1
 * @param {number} y2 second point in line 1
 * @param {number} x3 first point in line 2
 * @param {number} y3 first point in line 2
 * @param {number} x4 second point in line 2
 * @param {number} y4 second point in line 2
 * @param {number} [thickness1] of line 1 (the line is centered in its thickness--see demo)
 * @param {number} [thickness2] of line 2 (the line is centered in its thickness--see demo)
 * @return {boolean}
 */
function lineLine(x1, y1, x2, y2, x3, y3, x4, y4, thickness1, thickness2) {
  if (thickness1 || thickness2) {
    return lineLineThickness(x1, y1, x2, y2, x3, y3, x4, y4, thickness1, thickness2);
  } else {
    return lineToLine(x1, y1, x2, y2, x3, y3, x4, y4);
  }
}

function lineLineThickness(x1, y1, x2, y2, x3, y3, x4, y4, thickness1, thickness2) {
  if (thickness1 && thickness2) {
    return polygonPolygon(lineToPolygon(x1, y1, x2, y2, thickness1), lineToPolygon(x3, y3, x4, y4, thickness2));
  } else if (thickness1) {
    return linePolygon(x3, y3, x4, y4, lineToPolygon(x1, y1, x2, y2, thickness1));
  } else if (thickness2) {
    return linePolygon(x1, y1, x2, y2, lineToPolygon(x3, y3, x4, y4, thickness1));
  }
}

function pointLine(xp, yp, x1, y1, x2, y2, tolerance) {
  return linePoint(x1, y1, x2, y2, xp, yp, tolerance);
}

function polygonPoint(points, x, y, tolerance) {
  var length = points.length;
  var c = false;
  var i, j;
  for (i = 0, j = length - 2; i < length; i += 2) {
    if (
      points[i + 1] > y !== points[j + 1] > y &&
      x < ((points[j] - points[i]) * (y - points[i + 1])) / (points[j + 1] - points[i + 1]) + points[i]
    ) {
      c = !c;
    }
    j = i;
  }
  if (c) {
    return true;
  }
  for (i = 0; i < length; i += 2) {
    var p1x = points[i];
    var p1y = points[i + 1];
    var p2x, p2y;
    if (i === length - 2) {
      p2x = points[0];
      p2y = points[1];
    } else {
      p2x = points[i + 2];
      p2y = points[i + 3];
    }
    if (linePoint(p1x, p1y, p2x, p2y, x, y, tolerance)) {
      return true;
    }
  }
  return false;
}

/**
 * turns a line into a polygon using thickness
 * @param {number} x1 first point of line
 * @param {number} y1 first point of line
 * @param {number} x2 second point of line
 * @param {number} y2 second point of line
 * @param {number} thickness of line
 */
function lineToPolygon(x1, y1, x2, y2, thickness) {
  const angle = Math.atan2(y2 - y1, x2 - x1) - Math.PI / 2;
  const half = thickness / 2;
  const cos = Math.cos(angle) * half;
  const sin = Math.sin(angle) * half;
  return [x1 - cos, y1 - sin, x2 - cos, y2 - sin, x2 + cos, y2 + sin, x1 + cos, y1 + sin];
}

function polygonPolygon(points1, points2) {
  var a = points1;
  var b = points2;
  var polygons = [a, b];
  var minA, maxA, projected, minB, maxB, j;
  for (var i = 0; i < polygons.length; i++) {
    var polygon = polygons[i];
    for (var i1 = 0; i1 < polygon.length; i1 += 2) {
      var i2 = (i1 + 2) % polygon.length;
      var normal = { x: polygon[i2 + 1] - polygon[i1 + 1], y: polygon[i1] - polygon[i2] };
      minA = maxA = null;
      for (j = 0; j < a.length; j += 2) {
        projected = normal.x * a[j] + normal.y * a[j + 1];
        if (minA === null || projected < minA) {
          minA = projected;
        }
        if (maxA === null || projected > maxA) {
          maxA = projected;
        }
      }
      minB = maxB = null;
      for (j = 0; j < b.length; j += 2) {
        projected = normal.x * b[j] + normal.y * b[j + 1];
        if (minB === null || projected < minB) {
          minB = projected;
        }
        if (maxB === null || projected > maxB) {
          maxB = projected;
        }
      }
      if (maxA < minB || maxB < minA) {
        return false;
      }
    }
  }
  return true;
}

function distanceSquared(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

function linePoint(x1, y1, x2, y2, xp, yp, tolerance) {
  tolerance = tolerance || 1;
  return (
    Math.abs(distanceSquared(x1, y1, x2, y2) - (distanceSquared(x1, y1, xp, yp) + distanceSquared(x2, y2, xp, yp))) <=
    tolerance
  );
}

export { pointLine, lineToLine, linePoint, polygonPolygon, lineToPolygon, polygonPoint, linePolygon, lineLine };
