// console.log('clipper-ops.js')

//import * as Clipper from 'js-angusj-clipper';
import Clipper from './clipper';
import { Vector3 } from 'three';

function vPolygonToCPath(pList, scaleFactor) {
  let scale = scaleFactor || 10;

  let temp_clip_path = new Clipper.Path();
  pList.forEach((p) => {
    let temp_clipper_pt = new Clipper.IntPoint(p.x * scale, p.z * scale);
    temp_clip_path.push(temp_clipper_pt);
  });
  return temp_clip_path;
}

function cPathToVPolygon(clipper_path, scaleFactor) {
  let scale = scaleFactor || 10;

  let temp_pList = [];

  if (!clipper_path) {
    return temp_pList;
  }
  clipper_path.forEach((cPt) => {
    let temp_pt = new Vector3(cPt.X / scale, 0, cPt.Y / scale);
    temp_pList.push(temp_pt);
  });
  return temp_pList;
}

function getOffsetOneSide(pList, k, settings) {
  const { index } = settings;

  const points = [pList[index], pList[index + 1]];

  // console.log('Points are:: ', points)
  if (!points[0] || !points[1]) {
    return null;
  }

  // const i = index ? index : 0

  const pipe = thicken(points, k * 10);

  const difference = getDifference(pList, [pipe]);

  return difference[0];
}

function getPartialOffset(pList, k, settings) {
  const points = settings.indices.map((i) => pList[i]);

  // console.log('Florplate base pts:: ', points)

  const pipe = thicken(points, k * 10);

  const intersection = getIntersection(pList, pipe);

  return intersection;
}

function getOffset(pList, k) {
  const clean_delta = 0.1;
  const miterLimit = 2;
  const arcTolerance = 0.25;
  const delta = -k * 10;

  const co = new Clipper.ClipperOffset(miterLimit, arcTolerance);

  const offsetted_path = new Clipper.Paths();

  let temp_path = vPolygonToCPath(pList);
  temp_path = Clipper.Clipper.SimplifyPolygon(temp_path, Clipper.PolyFillType.pftPositive);

  co.AddPaths(temp_path, Clipper.JoinType.jtMiter, Clipper.EndType.etClosedPolygon);
  co.Execute(offsetted_path, delta);

  if (offsetted_path[0]) {
    return cPathToVPolygon(offsetted_path[0]);
  } else {
    return cPathToVPolygon(offsetted_path); //develop handler for multiple paths returned - done
  }
}

function thicken(pList, k, scaleFactor, openButt, miterLimit) {
  let clean_delta = 0.1;
  miterLimit = miterLimit || 2;
  let arcTolerance = 0.25;
  let delta = k;

  var co = new Clipper.ClipperOffset(miterLimit, arcTolerance);
  let offsetted_path = new Clipper.Path();

  let temp_path = vPolygonToCPath(pList, scaleFactor);

  const endType = openButt ? Clipper.EndType.etOpenButt : Clipper.EndType.etOpenSquare;

  co.AddPath(temp_path, Clipper.JoinType.jtMiter, endType);
  co.Execute(offsetted_path, delta);

  // console.log("Thicken result:: ", offsetted_path);

  return cPathToVPolygon(offsetted_path[0], scaleFactor); //develop handler for multiple paths returned
}

function getDifferenceMult(polygons, cutters) {
  const differences = [];

  polygons.forEach((polygon) => differences.push(...getDifference(polygon, cutters)));

  return differences;
}

function getDifference(polygon, cutters) {
  if (typeof cutters == null || cutters == null) {
    console.log('no axis given');
    return [polygon];
  }

  let subj_path = vPolygonToCPath(polygon);

  let clip_paths = [];

  cutters.forEach((cutter) => clip_paths.push(vPolygonToCPath(cutter)));

  let cpr = new Clipper.Clipper();

  cpr.AddPath(subj_path, Clipper.PolyType.ptSubject, true);
  cpr.AddPaths(clip_paths, Clipper.PolyType.ptClip, true);

  let solution_paths = new Clipper.Paths();
  let clipType = Clipper.ClipType.ctDifference;

  let subject_fillType = Clipper.PolyFillType.pftNonZero;
  let clip_fillType = Clipper.PolyFillType.pftNonZero;

  let succeeded = cpr.Execute(clipType, solution_paths, subject_fillType, clip_fillType);

  let diff_arr = [];

  for (var i = 0; i < solution_paths.length; i++) {
    diff_arr.push(cPathToVPolygon(solution_paths[i]));
  }

  // console.log("diff_arr: ", diff_arr)

  return diff_arr;
}

function smooth(polyline) {}

function cut(plgn, pline, scaleFactor) {
  if (typeof pline == null || pline == null) {
    console.log('no axis given');
    return [plgn];
  }

  let subj_path = vPolygonToCPath(plgn, scaleFactor);

  let clip_paths = [];

  for (var i = 0; i < pline.length; i++) {
    let path = thicken(pline[i].points, pline[i].width * 5, scaleFactor);
    clip_paths.push(vPolygonToCPath(path, scaleFactor));
  }
  // console.log("pline: ", pline)

  let cpr = new Clipper.Clipper();
  // console.log("clip_path", clip_path)

  cpr.AddPath(subj_path, Clipper.PolyType.ptSubject, true);
  cpr.AddPaths(clip_paths, Clipper.PolyType.ptClip, true);

  let solution_paths = new Clipper.Paths();
  let clipType = Clipper.ClipType.ctDifference;

  let subject_fillType = Clipper.PolyFillType.pftNonZero;
  let clip_fillType = Clipper.PolyFillType.pftNonZero;

  let succeeded = cpr.Execute(clipType, solution_paths, subject_fillType, clip_fillType);

  let diff_arr = [];

  for (var i = 0; i < solution_paths.length; i++) {
    diff_arr.push(cPathToVPolygon(solution_paths[i], scaleFactor));
  }

  // console.log("diff_arr: ", diff_arr)

  return diff_arr;
}

function pointCut(plgn, points, scaleFactor) {
  if (!points && points.length === 0) {
    console.log('no points given');
    return [plgn];
  }

  let subj_path = vPolygonToCPath(plgn, scaleFactor);

  let clip_paths = [];

  let path = thicken(points, (2 - 1) * 5, scaleFactor);
  clip_paths.push(vPolygonToCPath(path, scaleFactor));

  // for (var i = 0; i < pline.length; i++) {
  //   let path = thicken(pline[i].points, (pline[i].width - 1) * 5, scaleFactor);
  //   clip_paths.push(vPolygonToCPath(path, scaleFactor));
  // }
  // console.log("pline: ", pline)

  let cpr = new Clipper.Clipper();
  // console.log("clip_path", clip_path)

  cpr.AddPath(subj_path, Clipper.PolyType.ptSubject, true);
  cpr.AddPaths(clip_paths, Clipper.PolyType.ptClip, true);

  let solution_paths = new Clipper.Paths();
  let clipType = Clipper.ClipType.ctDifference;

  let subject_fillType = Clipper.PolyFillType.pftNonZero;
  let clip_fillType = Clipper.PolyFillType.pftNonZero;

  let succeeded = cpr.Execute(clipType, solution_paths, subject_fillType, clip_fillType);

  let diff_arr = [];

  for (var i = 0; i < solution_paths.length; i++) {
    diff_arr.push(cPathToVPolygon(solution_paths[i], scaleFactor));
  }

  // console.log("diff_arr: ", diff_arr)

  return diff_arr;
}

function thickenEdge(edge, polygon, depth) {
  const width = depth * 10;

  const pipe = thicken(edge, width);
  const intersection = getIntersection(pipe, polygon);

  return intersection;
}

function getIntersections(plgn, pline) {
  if (pline === null || pline == null) {
    console.log('no axis given');
    return [plgn];
  }

  let subj_path = vPolygonToCPath(plgn);

  // let clip_path = []

  // for (var i = 0; i < pline.length; i++) {
  // let path = clipper.thicken( pline[i], half_width )
  let clip_path = vPolygonToCPath(pline);

  // }
  // console.log("pline: ", pline)

  let cpr = new Clipper.Clipper();
  // console.log("clip_path", clip_path)

  cpr.AddPath(subj_path, Clipper.PolyType.ptSubject, true);
  cpr.AddPath(clip_path, Clipper.PolyType.ptClip, true);

  let solution_paths = new Clipper.Paths();
  let clipType = Clipper.ClipType.ctIntersection;

  let subject_fillType = Clipper.PolyFillType.pftNonZero;
  let clip_fillType = Clipper.PolyFillType.pftNonZero;

  let succeeded = cpr.Execute(clipType, solution_paths, subject_fillType, clip_fillType);
  // console.log( 'clip_path:: ', clipType )
  let int_arr = [];

  for (var i = 0; i < solution_paths.length; i++) {
    int_arr.push(cPathToVPolygon(solution_paths[i]));
  }

  if (int_arr.length) return int_arr;
  else return null;
}

function getIntersection(plgn, pline) {
  if (typeof pline == null || pline == null) {
    console.log('no axis given');
    return [plgn];
  }

  let subj_path = vPolygonToCPath(plgn);

  // let clip_path = []

  // for (var i = 0; i < pline.length; i++) {
  // let path = clipper.thicken( pline[i], half_width )
  let clip_path = vPolygonToCPath(pline);

  // }
  // console.log("pline: ", pline)

  let cpr = new Clipper.Clipper();
  // console.log("clip_path", clip_path)

  cpr.AddPath(subj_path, Clipper.PolyType.ptSubject, true);
  cpr.AddPath(clip_path, Clipper.PolyType.ptClip, true);

  let solution_paths = new Clipper.Paths();
  let clipType = Clipper.ClipType.ctIntersection;

  let subject_fillType = Clipper.PolyFillType.pftNonZero;
  let clip_fillType = Clipper.PolyFillType.pftNonZero;

  let succeeded = cpr.Execute(clipType, solution_paths, subject_fillType, clip_fillType);
  // console.log( 'clip_path:: ', clipType )
  let int_arr = [];

  for (var i = 0; i < solution_paths.length; i++) {
    int_arr.push(cPathToVPolygon(solution_paths[i]));
  }

  // console.log("int_arr: ", int_arr)

  if (int_arr.length) return int_arr[0];
  else return null;
}

function mergePlots(predator, prey) {
  if (predator.length == 0) return [prey];

  let subj_path = [];

  for (var i = 0; i < predator.length; i++) {
    subj_path.push(vPolygonToCPath(predator[i]));
  }

  let clip_path = vPolygonToCPath(prey);

  let cpr = new Clipper.Clipper();

  cpr.AddPaths(subj_path, Clipper.PolyType.ptSubject, true);
  cpr.AddPath(clip_path, Clipper.PolyType.ptClip, true);

  let solution_paths = new Clipper.Paths();
  let clipType = Clipper.ClipType.ctUnion;

  let subject_fillType = Clipper.PolyFillType.pftPositive;
  let clip_fillType = Clipper.PolyFillType.pftPositive;

  let succeeded = cpr.Execute(clipType, solution_paths, subject_fillType, clip_fillType);

  let union_arr = [];

  for (var i = 0; i < solution_paths.length; i++) {
    union_arr.push(cPathToVPolygon(solution_paths[i]));
  }

  return union_arr;
}

function getUnion(polygons) {
  let subj_path = [],
    clip_path = [];

  for (var i = 0; i < polygons.length; i++) {
    subj_path.push(vPolygonToCPath(polygons[i]));
    clip_path.push(vPolygonToCPath(polygons[i]));
  }

  let cpr = new Clipper.Clipper();

  cpr.AddPaths(subj_path, Clipper.PolyType.ptSubject, true);
  // cpr.AddPaths( clip_path, Clipper.PolyType.ptClip, true )

  let solution_paths = new Clipper.Paths();
  let clipType = Clipper.ClipType.ctUnion;

  let subject_fillType = Clipper.PolyFillType.pftNonZero;
  let clip_fillType = Clipper.PolyFillType.pftNonZero;

  let succeeded = cpr.Execute(clipType, solution_paths, subject_fillType, clip_fillType);
  let union_arr = [];

  for (var i = 0; i < solution_paths.length; i++) {
    union_arr = cPathToVPolygon(solution_paths[i]);
  }

  return union_arr;
}

function getUnions(polygons) {
  let subj_path = [],
    clip_path = [];

  for (var i = 0; i < polygons.length; i++) {
    subj_path.push(vPolygonToCPath(polygons[i]));
    clip_path.push(vPolygonToCPath(polygons[i]));
  }

  let cpr = new Clipper.Clipper();

  cpr.AddPaths(subj_path, Clipper.PolyType.ptSubject, true);
  // cpr.AddPaths( clip_path, Clipper.PolyType.ptClip, true )

  let solution_paths = new Clipper.Paths();
  let clipType = Clipper.ClipType.ctUnion;

  let subject_fillType = Clipper.PolyFillType.pftNonZero;
  let clip_fillType = Clipper.PolyFillType.pftNonZero;

  let succeeded = cpr.Execute(clipType, solution_paths, subject_fillType, clip_fillType);
  let union_arr = [];

  for (var i = 0; i < solution_paths.length; i++) {
    union_arr.push(cPathToVPolygon(solution_paths[i]));
  }

  return union_arr;
}

function line_intscn_in_plgn(line, polygon) {
  let subj_path = vPolygonToCPath(line);
  let clip_path = vPolygonToCPath(polygon);

  let cpr = new Clipper.Clipper();

  cpr.AddPath(subj_path, Clipper.PolyType.ptSubject, false);
  cpr.AddPath(clip_path, Clipper.PolyType.ptClip, true);

  var solution_polytree = new Clipper.PolyTree();
  let clipType = Clipper.ClipType.ctIntersection;

  let subject_fillType = Clipper.PolyFillType.pftNonZero;
  let clip_fillType = Clipper.PolyFillType.pftNonZero;

  let succeeded = cpr.Execute(clipType, solution_polytree, subject_fillType, clip_fillType);
  return cPathToVPolygon(solution_polytree.m_AllPolys[0].m_polygon);
}

function getOffsetInverse(pList, k) {
  return getOffset(pList, -k);
}

export {
  cut,
  getOffset,
  getOffsetOneSide,
  getPartialOffset,
  thicken,
  thickenEdge,
  getUnion,
  getUnions,
  getDifference,
  getDifferenceMult,
  getIntersections,
  getIntersection,
  pointCut,
  getOffsetInverse,
};
