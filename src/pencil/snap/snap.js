import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import LineMaterials from '../materials/line-materials';
import { mod } from '../math/math-tools';
class Snap {
  constructor(editor) {
    this.editor = editor;
    this.scene = editor.viewport.scene;
    this.cache = {
      points: [],
      edges: [],
    };

    this.pickingArr = [];

    this.snapPt = null;
    this.intersectPt = null;

    this.tempCache = [];
    this.tempLine = [];
    this.tempSphere = [];
    this.tempEdgeHighlight = [];
    this.edgeExtension = [];

    this.highlightedEdges = [];

    this.currEdge = null;
    this.prevEdge = null;

    this.pointHighlight = this.createPointHighlight(LineMaterials.blueMesh, 2);
    this.perpHighlight = this.createPointHighlight(LineMaterials.orangeMesh, 2);
    this.midPointHighlight = this.createPointHighlight(LineMaterials.orangeMesh, 2);

    // this.init();
  }
  init = () => {
    const plots = { ...this.editor.state.specimen.plots };
    // const keys = Object.keys(plots);

    // this.plotBoundary.plots = {};

    for (const key in plots) {
      console.log(key);
      // const plot = plots[key];
      // // this.plotBoundary.plots[key] = { ...plot, pointsId: [], edgesId: [] };
      // console.log('PLOT IN SNAP ', plot);
    }
  };

  createPointHighlight = (material, size = 1, pos) => {
    const geometry = new THREE.SphereGeometry(size);

    const sphereInter = new THREE.Mesh(geometry, material);
    sphereInter.visible = false;
    if (pos) {
      sphereInter.visible = true;
      sphereInter.position.copy(pos);
      this.tempSphere.push(sphereInter);
    }
    this.scene.add(sphereInter);
    return sphereInter;
  };

  createEdgeHighlight = (start, end, curr, mat = LineMaterials.blueLine) => {
    const positions = [];
    if (curr) {
      this.longestDistance(start, end, curr).forEach((point) => {
        positions.push(...point);
      });
    } else {
      positions.push(...start, ...end);
    }
    const lineGeometry = new LineGeometry().setPositions(positions);
    const line = new Line2(lineGeometry, mat);
    line.computeLineDistances();
    this.scene.add(line);
    this.tempEdgeHighlight.push(line);
  };

  longestDistance = (start, end, curr) => {
    const startEnd = start.distanceTo(end);
    const startCurr = start.distanceTo(curr);
    const endCurr = end.distanceTo(curr);

    const maxDistance = Math.max(startEnd, startCurr, endCurr);
    switch (maxDistance) {
      case startEnd:
        return [start, end];
      case startCurr:
        return [start, curr];
      case endCurr:
        return [end, curr];
      default:
        return [start, end];
    }
  };
  addEdgesToCache = (points) => {
    // this.cache.edges.push(...edges);
    // this.updatePickingArr();

    if (points.length === 2) {
      // line segment
      if (points[0].distanceTo(points[1]) > 3) {
        this.cache.edges.push([points[0], points[1]]);
      }
    } else {
      for (let i = 0; i < points.length - 1; i++) {
        // if edge is too small, don't add
        if (points[i].distanceTo(points[i + 1]) > 3) {
          this.cache.edges.push([points[i], points[i + 1]]);
        }
      }
      // Adding last line segment of closed polygon. if edge is too small, don't add
      if (points[points.length - 1].distanceTo(points[0]) > 3) {
        this.cache.edges.push([points[points.length - 1], points[0]]); // close the shape for plot boundary
      }
    }
  };

  addPointsToCache = (points) => {
    points.forEach((point) => {
      this.cache.points.push(point);
    });
  };

  snap = (currPosition, plots, transformControls, savedPt, event) => {
    this.cache = { points: [], edges: [] };

    const plotUuids = Object.keys(plots);
    for (let i = 0; i < plotUuids.length; i++) {
      if (plotUuids[i] !== transformControls.attached.plotUuid) {
        // add points and edges to cache
        this.addPointsToCache(plots[plotUuids[i]].shape);
        this.addEdgesToCache(plots[plotUuids[i]].shape);
      } else {
        // if selected plot, add edges except for adjacent edges of the selected point and add points except for selected point
        // ADD EDGE EXCEPT FOR ADJACENT EDGES
        const plot = plots[plotUuids[i]];
        const plotLength = plot.shape.length;
        const ptIndex = transformControls.attached.ptIndex;
        for (let j = 0; j < plotLength - 1; j++) {
          if (j !== ptIndex && j + 1 !== ptIndex) {
            this.cache.edges.push([plot.shape[j], plot.shape[j + 1]]);
          }
        }
        if (ptIndex !== 0 && ptIndex !== plot.shape.length - 1) {
          this.cache.edges.push([plot.shape[plotLength - 1], plot.shape[0]]);
        }
        // ADD RECORDED EDGE (RECORDED ON MOUSEUP)
        const nextPt = plot.shape[(ptIndex + 1) % plot.shape.length];
        const prevPt = plot.shape[mod(ptIndex - 1, plot.shape.length)];
        const currPt = plot.shape[ptIndex];
        this.addEdgesToCache([prevPt, savedPt]);
        this.addEdgesToCache([savedPt, nextPt]);
        // ADD POINTS EXCEPT SELECTED POINT
        const filteredShape = plot.shape.filter((currValue, index) => {
          if (index === ptIndex) {
            return false;
          } else {
            return true;
          }
        });
        this.clearTempCache();
        // add points which create perpendicular plots to cache
        if (event) {
          if (event.shiftKey) {
            const perpSnaps = this.makePerpendicular(prevPt, nextPt, currPt, savedPt);
            filteredShape.push(...perpSnaps);
          }
        }
        this.addPointsToCache(filteredShape);
      }
    }

    const point = this.pointSnap(currPosition);
    if (point) {
      return point;
    }

    const midpoint = this.midPointSnap(currPosition);
    if (midpoint) {
      return midpoint;
    }

    const snapPt = this.edgeSnap(currPosition);
    if (snapPt) {
      return snapPt;
    }
  };

  // for plot boundary editing
  makePerpendicular = (prev, next, curr, saved) => {
    const savedNext = new THREE.Vector3(next.x - saved.x, next.y - saved.y, next.z - saved.z);
    const savedPrev = new THREE.Vector3(prev.x - saved.x, prev.y - saved.y, prev.z - saved.z);
    const distPrev = savedPrev.dot(savedNext) / savedNext.length();
    const snapPrev = saved.clone().add(savedNext.clone().normalize().multiplyScalar(distPrev));
    const distNext = savedNext.dot(savedPrev) / savedPrev.length();
    const snapNext = saved.clone().add(savedPrev.clone().normalize().multiplyScalar(distNext));
    this.displayPerpSnaps(prev, next, snapPrev, snapNext);
    return [snapPrev, snapNext];
  };

  snapPoly = (lastPt, intersects, transformControlPosition) => {
    this.highlightedEdges = [];
    this.prevEdge = this.currEdge;
    this.currEdge = null;
    // console.log('snap poly: last pt, intersects, cache ', lastPt, intersects, this.cache);
    this.tempSphere.forEach((sphere) => {
      this.scene.remove(sphere);
    });
    this.tempSphere = [];
    if (this.tempEdgeHighlight.length > 0) {
      this.tempEdgeHighlight.forEach((line) => {
        this.scene.remove(this.tempEdgeHighlight[0]);
        line.geometry.dispose();
        line.material.dispose();
        this.tempEdgeHighlight.shift();
      });
    }

    // reset
    this.pointHighlight.visible = false;
    this.midPointHighlight.visible = false;
    this.perpHighlight.visible = false;

    if (!intersects || intersects.length === 0) {
      if (transformControlPosition) {
        this.intersectPt = transformControlPosition;
      } else {
        this.pointHighlight.visible = false;
        return;
      }
    }
    if (intersects) {
      // console.log('mouse snap');
      var intersectPt = intersects[0].point;
      this.intersectPt = intersectPt;
    }

    if (this.pointSnapPoly(this.intersectPt)) {
      return;
    }

    if (this.midPointSnapPoly(this.intersectPt)) {
      return;
    }

    const snapPt = this.edgeSnapPoly(this.intersectPt);
    // console.log('EDGE ', snapPt);

    if (snapPt) {
      this.pointHighlight.visible = true;
      this.pointHighlight.position.copy(snapPt);
    }

    if (!snapPt) {
      this.snapPt = null;
      // return;
    }

    if (this.highlightedEdges.length >= 2) {
      for (let i = 0; i < this.highlightedEdges.length - 1; i++) {
        this.intersect(
          this.currEdge[0].x,
          this.currEdge[0].z,
          this.currEdge[1].x,
          this.currEdge[1].z,
          this.highlightedEdges[i][0].x,
          this.highlightedEdges[i][0].z,
          this.highlightedEdges[i][1].x,
          this.highlightedEdges[i][1].z
        );
      }
      this.findIntersect();
    }

    // if (this.currEdge) {
    //   // FIND INTERSECT
    // }
    // perpendicular point snapping
    if (lastPt) {
      this.findPerpendicular(lastPt);
    }
  };

  // point snapping. Higher priority than edge. If this is applicable, return immediately.
  pointSnap = (currPosition) => {
    let snapPt = null;
    for (let i = 0; i < this.cache.points.length; i++) {
      let point = this.cache.points[i];
      const dist = point.distanceTo(currPosition);
      if (dist < 0.1) {
        break;
      }
      if (dist < 1) {
        snapPt = point;
        // this.snapPt = point;
        return snapPt;
      }
    }
    return null;
  };

  pointSnapPoly = (intersectPt) => {
    let snapPt = null;
    for (let i = 0; i < this.cache.points.length; i++) {
      let point = this.cache.points[i];
      const dist = point.distanceTo(intersectPt);
      if (dist < 2 && dist != 0) {
        snapPt = point;
        this.snapPt = point;
        this.midPointHighlight.visible = true;
        this.midPointHighlight.position.copy(snapPt);
        return true;
      }
    }
    return false;
  };

  // midpoint snapping. Next priority after point.
  midPointSnap = (currPosition) => {
    let snapPt = null;
    for (let i = 0; i < this.cache.edges.length; i++) {
      let edge = this.cache.edges[i];
      const startPt = edge[0];
      const edgeVector = new THREE.Vector3(edge[1].x - edge[0].x, edge[1].y - edge[0].y, edge[1].z - edge[0].z);
      const midVector = edgeVector.multiplyScalar(0.5);
      const midPt = new THREE.Vector3(startPt.x + midVector.x, startPt.y + midVector.y, startPt.z + midVector.z);

      const dist = midPt.distanceTo(currPosition);
      if (dist < 1) {
        snapPt = midPt;
        return snapPt;
      }
    }
    return null;
  };

  midPointSnapPoly = (intersectPt) => {
    let snapPt = null;
    for (let i = 0; i < this.cache.edges.length; i++) {
      let edge = this.cache.edges[i];
      const startPt = edge[0];
      const endPt = edge[1];
      const midPt = new THREE.Vector3((startPt.x + endPt.x) / 2, (startPt.y + endPt.y) / 2, (startPt.z + endPt.z) / 2);
      const dist = midPt.distanceTo(intersectPt);
      if (dist < 1) {
        snapPt = midPt;
        this.snapPt = snapPt;
        this.midPointHighlight.visible = true;
        this.midPointHighlight.position.copy(snapPt);
        return true;
      }
    }
    return false;
  };

  // edge snapping
  edgeSnap = (currPosition) => {
    let distance = 1000;
    let snapPt = null;
    this.cache.edges.forEach((edge) => {
      const startPt = edge[0];
      const endPt = edge[1];
      const edgeVector = new THREE.Vector3(endPt.x - startPt.x, endPt.y - startPt.y, endPt.z - startPt.z);
      const startToPoint = new THREE.Vector3(
        currPosition.x - edge[0].x,
        currPosition.y - edge[0].y,
        currPosition.z - edge[0].z
      );

      const projectOnEdgeDist = startToPoint.dot(edgeVector) / edgeVector.length();

      const projectOnEdge = edgeVector.normalize().multiplyScalar(projectOnEdgeDist);
      const nearestPoint = new THREE.Vector3(
        startPt.x + projectOnEdge.x,
        startPt.y + projectOnEdge.y,
        startPt.z + projectOnEdge.z
      );
      const currDistance = nearestPoint.distanceTo(currPosition);
      // console.log('distance ', currDistance);

      // if distance between nearest point on the edge and the transform control is less than 5, snap
      if (currDistance < distance && currDistance < 1) {
        distance = currDistance;
        snapPt = nearestPoint;
        // this.snapPt = snapPt;
        // this.currEdge = edge;
      }
    });

    return snapPt;
  };

  edgeSnapPoly = (intersectPt) => {
    let distance = 1000;
    let snapPt = null;
    this.cache.edges.forEach((edge) => {
      const startPt = edge[0];
      const endPt = edge[1];
      const edgeVector = new THREE.Vector3(edge[1].x - edge[0].x, edge[1].y - edge[0].y, edge[1].z - edge[0].z);
      const edgeLength = new THREE.Vector3(
        edge[1].x - edge[0].x,
        edge[1].y - edge[0].y,
        edge[1].z - edge[0].z
      ).length();
      // console.log(edgeVector);
      const startToPoint = new THREE.Vector3(
        intersectPt.x - edge[0].x,
        intersectPt.y - edge[0].y,
        intersectPt.z - edge[0].z
      );

      const projectOnEdgeDist = startToPoint.dot(edgeVector) / edgeVector.length();

      const projectOnEdge = edgeVector.normalize().multiplyScalar(projectOnEdgeDist);
      const nearestPoint = new THREE.Vector3(
        startPt.x + projectOnEdge.x,
        startPt.y + projectOnEdge.y,
        startPt.z + projectOnEdge.z
      );
      // console.log('nearest point', nearestPoint);
      const currDistance = nearestPoint.distanceTo(intersectPt);
      // console.log('distance ', currDistance);
      if (currDistance < distance && currDistance < 5) {
        if (projectOnEdgeDist < edgeLength && projectOnEdgeDist > 0) {
          // add to cache of approved extension
          if (this.edgeExtension.includes(edge) == false) {
            this.edgeExtension.push(edge);
          }

          this.edgeTimeout(edge);
          // set timeout;
          this.highlightedEdges.push(edge);
          distance = currDistance;
          snapPt = nearestPoint;
          this.snapPt = snapPt;
          this.currEdge = edge;
          this.pointHighlight.visible = true;
          this.pointHighlight.position.copy(snapPt);
          this.createEdgeHighlight(edge[0], edge[1], snapPt);
          return snapPt;
        }

        if (this.edgeExtension.includes(edge)) {
          this.highlightedEdges.push(edge);
          distance = currDistance;
          snapPt = nearestPoint;
          this.snapPt = snapPt;
          this.currEdge = edge;
          this.pointHighlight.visible = true;
          this.pointHighlight.position.copy(snapPt);
          this.createEdgeHighlight(edge[0], edge[1], snapPt);
        }
      }
      // return snapPt;
    });
    // console.log('EDGE ', this.snapPt);
    return snapPt;
  };

  findPerpendicular = (lastPt) => {
    if (!lastPt) {
      return;
    }

    if (!this.currEdge) {
      return;
    }

    const startPt = this.currEdge[0];
    const endPt = this.currEdge[1];

    const edgeVector = new THREE.Vector3(endPt.x - startPt.x, endPt.y - startPt.y, endPt.z - startPt.z);
    const startToLastPt = new THREE.Vector3(lastPt.x - startPt.x, lastPt.y - startPt.y, lastPt.z - startPt.z);
    const projectLastPtDist = startToLastPt.dot(edgeVector) / edgeVector.length();

    const projectLastPtOnEdge = edgeVector.normalize().multiplyScalar(projectLastPtDist);
    const perpPt = new THREE.Vector3(
      startPt.x + projectLastPtOnEdge.x,
      startPt.y + projectLastPtOnEdge.y,
      startPt.z + projectLastPtOnEdge.z
    );

    this.tempCache = [];
    if (perpPt.distanceTo(this.intersectPt) >= 10) {
      this.tempLine.forEach((line) => {
        this.scene.remove(this.scene.getObjectById(line));
      });
      this.tempLine = [];
    }

    if (perpPt.distanceTo(this.intersectPt) < 10) {
      this.perpHighlight.visible = true;
      this.perpHighlight.position.copy(perpPt);

      this.tempCache.push(...lastPt);
      this.tempCache.push(...perpPt);
      const lineGeometry = new LineGeometry().setPositions(this.tempCache);

      const lineMaterial = new LineMaterial({
        color: '#808080',
        linewidth: 0.005,
        dashed: true,
        dashSize: 1,
        gapSize: 1,
      });
      lineMaterial.defines.USE_DASH = '';
      const templine = new Line2(lineGeometry, lineMaterial);
      // computeLineDistances to enable dashed line
      templine.computeLineDistances();
      this.scene.add(templine);
      this.tempLine.push(templine.id);
    }
    if (perpPt.distanceTo(this.intersectPt) < 5) {
      this.snapPt = perpPt;
      this.perpPt = perpPt;
      this.pointHighlight.visible = false;
    }
  };

  getPerpendicular = (lastPt) => {
    if (!this.currEdge || !lastPt) {
      return;
    }
    const startPt = this.currEdge[0];
    const endPt = this.currEdge[1];

    const edgeVector = new THREE.Vector3(endPt.x - startPt.x, endPt.y - startPt.y, endPt.z - startPt.z);
    const startToLastPt = new THREE.Vector3(lastPt.x - startPt.x, lastPt.y - startPt.y, lastPt.z - startPt.z);
    const projectLastPtDist = startToLastPt.dot(edgeVector) / edgeVector.length();

    const projectLastPtOnEdge = edgeVector.normalize().multiplyScalar(projectLastPtDist);
    const perpPt = new THREE.Vector3(
      startPt.x + projectLastPtOnEdge.x,
      startPt.y + projectLastPtOnEdge.y,
      startPt.z + projectLastPtOnEdge.z
    );

    this.tempCache = [];
    if (perpPt.distanceTo(this.intersectPt) >= 10) {
      this.tempLine.forEach((line) => {
        this.scene.remove(this.scene.getObjectById(line));
      });
      this.tempLine = [];
    }

    if (perpPt.distanceTo(this.intersectPt) < 10) {
      this.perpHighlight.visible = true;
      this.perpHighlight.position.copy(perpPt);

      this.tempCache.push(...lastPt);
      this.tempCache.push(...perpPt);
      const lineGeometry = new LineGeometry().setPositions(this.tempCache);

      const lineMaterial = new LineMaterial({
        color: '#808080',
        linewidth: 0.005,
        dashed: true,
        dashSize: 1,
        gapSize: 1,
      });
      lineMaterial.defines.USE_DASH = '';
      const templine = new Line2(lineGeometry, lineMaterial);
      // computeLineDistances to enable dashed line
      templine.computeLineDistances();
      this.scene.add(templine);
      this.tempLine.push(templine.id);
    }
    this.pointHighlight.visible = false;
    this.perpHighlight.visible = true;
    this.perpHighlight.position.copy(perpPt);
    this.snapPt = perpPt;
    this.perpPt = perpPt;
  };

  findIntersect = () => {
    var intersectPts = [];
    this.highlightedEdges.forEach((edge) => {
      var EdgeIntersectPt = this.intersect(
        this.currEdge[0].x,
        this.currEdge[0].z,
        this.currEdge[1].x,
        this.currEdge[1].z,
        edge[0].x,
        edge[0].z,
        edge[1].x,
        edge[1].z
      );
      if (EdgeIntersectPt) {
        EdgeIntersectPt.y = this.intersectPt.y;
        intersectPts.push(EdgeIntersectPt);
      }
    });

    var currDistance = 999;
    intersectPts.forEach((pt) => {
      const ptVector = new THREE.Vector3(pt.x, pt.y, pt.z);
      const distance = this.intersectPt.distanceTo(ptVector);

      if (distance < currDistance && distance < 3) {
        this.snapPt = ptVector;
        this.pointHighlight.visible = false;
        this.perpHighlight.visible = true;
        this.perpHighlight.position.copy(this.snapPt);
      }
    });
  };
  clearGuides = () => {
    if (this.tempEdgeHighlight.length > 0) {
      this.tempEdgeHighlight.forEach((edge) => {
        this.scene.remove(edge);
        edge.geometry.dispose();
        edge.material.dispose();
      });
    }

    this.pointHighlight.visible = false;
    this.midPointHighlight.visible = false;
    this.perpHighlight.visible = false;
    this.snapPt = null;
    this.intersectPt = null;
  };
  // UTILS

  displayPerpSnaps = (prev, next, snapPrev, snapNext) => {
    const mat = LineMaterials.dashedLineMaterial;
    this.clearTempCache();
    this.tempSphere = [];
    this.tempEdgeHighlight = [];
    this.createEdgeHighlight(prev, snapNext, null, mat);
    this.createEdgeHighlight(next, snapPrev, null, mat);
    this.createEdgeHighlight(prev, snapPrev, null, mat);
    this.createEdgeHighlight(next, snapNext, null, mat);
    this.createPointHighlight(LineMaterials.blueMesh, 1, snapPrev);
    this.createPointHighlight(LineMaterials.blueMesh, 1, snapNext);
  };

  clearTempCache = () => {
    this.scene.remove(...this.tempEdgeHighlight);
    this.scene.remove(...this.tempSphere);
  };
  intersect = (x1, z1, x2, z2, x3, z3, x4, z4) => {
    // find intersection between two vector lines
    // Check if none of the lines are of length 0
    if ((x1 === x2 && z1 === z2) || (x3 === x4 && z3 === z4)) {
      return false;
    }

    const denominator = (z4 - z3) * (x2 - x1) - (x4 - x3) * (z2 - z1);

    // Lines are parallel
    if (denominator === 0) {
      return false;
    }

    let ua = ((x4 - x3) * (z1 - z3) - (z4 - z3) * (x1 - x3)) / denominator;
    let ub = ((x2 - x1) * (z1 - z3) - (z2 - z1) * (x1 - x3)) / denominator;

    // is the intersection along the segments
    // if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
    //   return false;
    // }

    // Return a object with the x and y coordinates of the intersection
    let x = x1 + ua * (x2 - x1);
    let z = z1 + ua * (z2 - z1);

    return { x, y: null, z };
  };

  edgeTimeout = (edge, time = 10000) => {
    setTimeout(() => {
      if (this.currEdge != edge) {
        if (this.prevEdge != edge) {
          const index = this.edgeExtension.indexOf(edge);
          this.edgeExtension.splice(index, 1);
        } else {
          this.edgeTimeout(edge, 5000);
        }
      } else {
        this.edgeTimeout(edge);
      }
    }, time);
  };

  // isInside(pt, startPt, endPt)
}

export default Snap;
