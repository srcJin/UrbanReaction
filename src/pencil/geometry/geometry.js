import { ExtrudeGeometry } from 'three';
import { Shape } from 'three';

export function ExtrudeFootprint(params) {
  let { depth, holes } = params;

  const shape = shapeFromPoints(params.shapePts);

  if (holes.length) {
    for (const hole of holes) {
      if (!hole.length) {
        continue;
      }
      shape.holes.push(shapeFromPoints(hole.reverse()));
    }
  }

  const geometry = new ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  geometry.rotateX(-Math.PI / 2);

  return geometry;

  function shapeFromPoints(cell) {
    const shape = new Shape();
    var o = cell[0]; // origin of the shape

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
}
