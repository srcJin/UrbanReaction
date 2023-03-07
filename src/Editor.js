import Pencil from './pencil/pencil';
import { convertPtToTHREEVector } from './pencil/boundary/utils';
import _ from 'lodash';

// this.pencil = new Pencil(this);

export const handlePencil = (pencilType, selected) => {
    // let cur = document.getElementById('mount');
    // this.removeInvisiblePlane();
    // this.viewport.controls.polyLineSelectMode = false;
    // this.viewport.controls.eraserMode = false;
    // cur.style.cursor = 'default';

    // switch (pencilType) {
    //   case 'SPLINE':
    //     this.handleSnap();
    //     this.pencil.togglePolyLine(false, false, false);
    //     this.pencil.togglePencil(true);
    //     break;
    // //   case 'POLYLINE':
    // //     this.handleSnap();
    // //     this.pencil.togglePencil(false);
    // //     if (selected?.mode === BLOCK || selected?.mode === BUILDING) {
    // //       this.pencil.polyLine.blocks = this.game.selection
    // //         ?.filter((s) => s.recipe?.type === 'block')
    // //         .map((s) => s.recipe);
    // //       this.clearSelection();

    // //       this.pencil.togglePolyLine(true, false, true);
    // //     } else {
    // //       this.pencil.togglePolyLine(true, false, false);
    // //     }
    // //     break;
    // //   case 'RULER':
    // //     this.addInvisiblePlane();
    // //     this.handleSnap();
    // //     this.pencil.togglePolyLine(true, true, false);
    // //     break;
    //   case 'ERASER':
    //     this.pencil.togglePencil(false);
    //     this.pencil.togglePolyLine(false, false, false);
    //     cur = document.getElementById('mount');
    //     this.viewport.controls.polyLineSelectMode = true;
    //     this.viewport.controls.eraserMode = true;
    //     cur.style.cursor = "url('/images/icons/eraser.svg') 22.5 45, default";
    //     break;
    //   default:
    //     cur = document.getElementById('mount');
    //     this.removeInvisiblePlane();
    //     this.pencil.togglePencil(false);
    //     this.pencil.togglePolyLine(false, false, false);
    //     this.viewport.controls.polyLineSelectMode = false;
    //     this.viewport.controls.eraserMode = false;
    //     cur.style.cursor = 'default';
    //     break;
    // }
  };



//  const handleSnap = () => {
//     this.pencil.snapper.cache = { points: [], edges: [] };
//     console.log('update plot');
//     const plots = _.cloneDeep(this.state.specimen.plots);
//     const blocks = _.cloneDeep(this.state.specimen.blocks);

//     this.plotBoundary.plots = {};

//     for (const key in plots) {
//       const plot = plots[key];
//       plot.shape = plot.shape.map((s) => convertPtToTHREEVector(s));
//       // this.plotBoundary.plots[key] = { ...plot, pointsId: [], edgesId: [] };
//       plot.shape = plot.shape.map((s) => convertPtToTHREEVector(s));
//       this.pencil.snapper.addPointsToCache(plot.shape);
//       this.pencil.snapper.addEdgesToCache(plot.shape);
//     }

//     for (const key in blocks) {
//       const block = blocks[key];
//       block.shape = block.shape.map((s) => convertPtToTHREEVector(s));
//       this.pencil.snapper.addPointsToCache(block.shape);
//       this.pencil.snapper.addEdgesToCache(block.shape);
//       const translation = block.translation.y;
//       const top = _.cloneDeep(block.shape).map((s) =>
//         convertPtToTHREEVector({ x: s.x, y: s.y + block.height + translation, z: s.z })
//       );
//       this.pencil.snapper.addPointsToCache(top);
//       this.pencil.snapper.addEdgesToCache(top);
//     }
//   };


