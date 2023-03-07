import * as THREE from 'three';
import { mathUtils } from './mathUtils.js';

export class TextureBuilder {
  constructor() {}

  static createProgramTexture(floorHeight, slabThickness, buildingColorHex, slabColorHex) {
    // let horizontalDivisionRatio = mathUtils.roundToStep(floorHeight, 1) * styles['default'].scaleH;
    //create a base canvas
    // console.log('createProgramTexture:: ', floorHeight, slabThickness);
    let canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    let context = canvas.getContext('2d');
    //paint it
    context.fillStyle = buildingColorHex;
    context.fillRect(0, 0, canvas.width, canvas.height);
    //draw slabs
    let slabRatio = slabThickness / floorHeight;
    let slabHeight = canvas.height * slabRatio;
    context.fillStyle = slabColorHex;
    context.fillRect(0, 0, canvas.width, slabHeight);
    let texture = new THREE.Texture(canvas);
    return texture;
  }

  static createFacadeTexture(floorHeight, slabThickness, buildingColorHex, slabColorHex, style) {
    const styleName = style && styles[style] ? style : 'default';
    let horizontalDivisionRatio = mathUtils.roundToStep(floorHeight, 1) * styles[styleName].scaleH;
    // let horizontalDivisionRatio = Math.random()*10
    //create a base canvas
    let canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    let context = canvas.getContext('2d');

    //paint it
    context.fillStyle = /*buildingColorHex;*/ '#777777';
    context.fillRect(0, 0, canvas.width, canvas.height);

    //draw slabs
    let slabRatio = slabThickness / floorHeight;
    let slabHeight = canvas.height * slabRatio;
    context.fillStyle = slabColorHex;
    context.fillRect(0, 0, canvas.width, slabHeight);

    // //draw windows
    let windowsAreaHeight = canvas.height - slabHeight;

    let stepH = (styles[styleName].scale * canvas.width) / horizontalDivisionRatio;

    let windowWidth = stepH * Math.sqrt(styles[styleName].horizontalOffset) - 1;
    let windowHeight = windowsAreaHeight * Math.sqrt(styles[styleName].verticalOffset) - 1;

    for (let i = 0; i < horizontalDivisionRatio; i++) {
      let windowOffsetX = (stepH - windowWidth) / 2;
      let windowOffsetY = (windowsAreaHeight - windowHeight) / 2;

      let verticalShift = ((windowsAreaHeight - windowHeight) / 2) * styles[styleName].verticalShift;

      let color = styles[styleName].color;
      let colorVariation = Math.floor(Math.random() * 50);

      context.fillStyle = 'rgb(' + [color.r, color.g, color.b + colorVariation].join(',') + ')';
      // context.fillRect(
      //     stepH * i + windowOffsetX,
      //     slabHeight + windowOffsetY - verticalShift,
      //     windowWidth,
      //     windowHeight
      // );

      let mullion = 0.15;
      let spandrel = 1.5;

      context.fillRect(
        stepH * i + windowOffsetX,
        windowHeight / 2,
        // slabHeight + windowOffsetY - verticalShift,
        stepH - mullion,
        windowHeight
      );
    }

    //create a bigger canvas then upscale smaller into it
    let canvas2 = document.createElement('canvas');
    canvas2.width = 512;
    canvas2.height = 512;
    let context2 = canvas2.getContext('2d');

    //disable smoothing (leads to blur when scale up)
    context2.imageSmoothingEnabled = false;
    context2.webkitImageSmoothingEnabled = false;
    context2.mozImageSmoothingEnabled = false;

    //copy small canvas to big one
    context2.drawImage(canvas, 0, 0, canvas2.width, canvas2.height);

    let texture = new THREE.Texture(canvas2);

    return texture;
  }

  static createColorTexture(floorHeight, slabThickness, buildingColorHex, slabColorHex, drawWindows, style) {
    const styleName = style && styles[style] ? style : 'default';
    let horizontalDivisionRatio = mathUtils.roundToStep(floorHeight, 1) * styles[styleName].scaleH;

    // let horizontalDivisionRatio = Math.random()*10

    //create a base canvas
    let canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    let context = canvas.getContext('2d');

    //paint it
    context.fillStyle = buildingColorHex;
    context.fillRect(0, 0, canvas.width, canvas.height);

    //draw slabs
    let slabRatio = slabThickness / floorHeight;
    let slabHeight = canvas.height * slabRatio;

    if (drawWindows) {
      context.fillStyle = buildingColorHex;
    } else {
      context.fillStyle = slabColorHex;
    }

    context.fillRect(0, 0, canvas.width, slabHeight);

    if (drawWindows == true) {
      // //draw windows
      let windowsAreaHeight = canvas.height - slabHeight;

      let stepH = (styles[styleName].scale * canvas.width) / horizontalDivisionRatio;

      let windowWidth = stepH * Math.sqrt(styles[styleName].horizontalOffset) - 1;
      let windowHeight = windowsAreaHeight * Math.sqrt(styles[styleName].verticalOffset) - 1;

      for (let i = 0; i < horizontalDivisionRatio; i++) {
        let windowOffsetX = (stepH - windowWidth) / 2;
        let windowOffsetY = (windowsAreaHeight - windowHeight) / 2;
        let verticalShift = ((windowsAreaHeight - windowHeight) / 2) * styles[styleName].verticalShift;

        let color = styles[styleName].color;
        let colorVariation = Math.floor(Math.random() * 50);

        context.fillStyle = 'rgb(' + [color.r, color.g, color.b + colorVariation].join(',') + ')';
        context.fillRect(
          stepH * i + windowOffsetX,
          slabHeight + windowOffsetY - verticalShift,
          windowWidth,
          windowHeight
        );
      }

      /**
       * Draw windows according to WWR
       */

      // let windowsAreaHeight = canvas.height - slabHeight
      // let stepH = canvas.width / windowDivisions

      // let windowWidth = stepH * (Math.sqrt(0.01 * wwr)) - 1
      // let windowHeight = windowsAreaHeight * (Math.sqrt(0.01 * wwr)) - 1

      // for (let i = 0; i < windowDivisions; i++) {
      //     let windowOffsetX = (stepH - windowWidth) / 2
      //     let windowOffsetY = (windowsAreaHeight - windowHeight) / 2
      //     let value = Math.floor(Math.random() * 10)

      //     context.fillStyle = 'rgb(' + [0, 49, 82 + value].join(',') + ')'
      //     context.fillRect(stepH * i + windowOffsetX, slabHeight + windowOffsetY, windowWidth, windowHeight)
      // }
    }

    //create a bigger canvas then upscale smaller into it
    let canvas2 = document.createElement('canvas');
    canvas2.width = 512;
    canvas2.height = 512;
    let context2 = canvas2.getContext('2d');

    //disable smoothing (leads to blur when scale up)
    context2.imageSmoothingEnabled = false;
    context2.webkitImageSmoothingEnabled = false;
    context2.mozImageSmoothingEnabled = false;

    //copy small canvas to big one
    context2.drawImage(canvas, 0, 0, canvas2.width, canvas2.height);

    let texture = new THREE.Texture(canvas2);

    return texture;
  }

  static createAlphaTexture(floorHeight, slabThickness, style) {
    const styleName = style && styles[style] ? style : 'default';

    let horizontalDivisionRatio = mathUtils.roundToStep(floorHeight, 1) * styles[styleName].scaleH;

    //create a base canvas
    let canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    let context = canvas.getContext('2d');

    //paint it
    context.fillStyle = '#ffffff'; //white is opaque
    context.fillRect(0, 0, canvas.width, canvas.height);

    //slabs
    let slabRatio = slabThickness / floorHeight;
    let slabHeight = canvas.height * slabRatio;

    //draw windows
    let windowsAreaHeight = canvas.height - slabHeight;

    let stepH = (styles[styleName].scale * canvas.width) / horizontalDivisionRatio;

    let windowWidth = stepH * Math.sqrt(styles[styleName].horizontalOffset) - 1;
    let windowHeight = windowsAreaHeight * Math.sqrt(styles[styleName].verticalOffset) - 1;

    context.fillStyle = 'rgb(' + [255, 255, 255].join(',') + ')'; //whiter -> less transparent

    for (let i = 0; i < horizontalDivisionRatio; i++) {
      let windowOffsetX = (stepH - windowWidth) / 2;
      let windowOffsetY = (windowsAreaHeight - windowHeight) / 2;
      let verticalShift = ((windowsAreaHeight - windowHeight) / 2) * styles[styleName].verticalShift;

      context.fillRect(
        stepH * i + windowOffsetX,
        slabHeight + windowOffsetY - verticalShift,
        windowWidth,
        windowHeight
      );
    }

    //create a bigger canvas then upscale smaller into it
    let canvas2 = document.createElement('canvas');
    canvas2.width = 256;
    canvas2.height = 256;
    let context2 = canvas2.getContext('2d');

    //disable smoothing (leads to blur when scale up)
    context2.imageSmoothingEnabled = false;
    context2.webkitImageSmoothingEnabled = false;
    context2.mozImageSmoothingEnabled = false;

    //copy small canvas to big one
    context2.drawImage(canvas, 0, 0, canvas2.width, canvas2.height);

    let texture = new THREE.Texture(canvas2);

    return texture;
  }

  static createRoughnessTexture(floorHeight, slabThickness, style) {
    const styleName = style && styles[style] ? style : 'default';

    let horizontalDivisionRatio = mathUtils.roundToStep(floorHeight, 1) * styles[styleName].scaleH;

    //create a base canvas
    let canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    let context = canvas.getContext('2d');

    //paint it
    context.fillStyle = '#000000';
    context.fillRect(0, 0, canvas.width, canvas.height);

    //slabs
    let slabRatio = slabThickness / floorHeight;
    let slabHeight = canvas.height * slabRatio;

    //draw windows
    let windowsAreaHeight = canvas.height - slabHeight;

    let stepH = (styles[styleName].scale * canvas.width) / horizontalDivisionRatio;

    let windowWidth = stepH * Math.sqrt(styles[styleName].horizontalOffset) - 1;
    let windowHeight = windowsAreaHeight * Math.sqrt(styles[styleName].verticalOffset) - 1;

    for (let i = 0; i < horizontalDivisionRatio; i++) {
      let windowOffsetX = (stepH - windowWidth) / 2;
      let windowOffsetY = (windowsAreaHeight - windowHeight) / 2;
      let verticalShift = ((windowsAreaHeight - windowHeight) / 2) * styles[styleName].verticalShift;

      context.fillStyle = 'rgb(' + [255, 255, 255].join(',') + ')'; //whiter -> more smooth mirror
      context.fillRect(
        stepH * i + windowOffsetX,
        slabHeight + windowOffsetY - verticalShift,
        windowWidth,
        windowHeight
      );
    }

    //create a bigger canvas then upscale smaller into it
    let canvas2 = document.createElement('canvas');
    canvas2.width = 256;
    canvas2.height = 256;
    let context2 = canvas2.getContext('2d');

    //disable smoothing (leads to blur when scale up)
    context2.imageSmoothingEnabled = false;
    context2.webkitImageSmoothingEnabled = false;
    context2.mozImageSmoothingEnabled = false;

    //copy small canvas to big one
    context2.drawImage(canvas, 0, 0, canvas2.width, canvas2.height);

    let texture = new THREE.Texture(canvas2);

    return texture;
  }

  static adjustTexture(texture, vOffset) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    texture.offset.set(0, vOffset);
    texture.center.set(0, 0.5);
    texture.needsUpdate = true;
    texture.anisotropy = 16;

    return texture;
  }
}

const styles = {
  // scale - ratio of the offset between windows group - from 0 to 1
  // scaleH - horizontal scale of the window group - - from 1 to inf, ints
  // horizontalOffset - ratio of the horizontal offset from the center of the individual window - from 0 to 1
  // verticalOffset - ratio of the vertical offset from the center of the individual window - from 0 to 1
  // verticalShift - ratio of the vertical svhift of the window group from the floor of a given storey - from 0 to 1
  // color - color of the window fill

  residential: {
    scale: 0.5,
    scaleH: 0.5,
    horizontalOffset: 0.7,
    verticalOffset: 0.3,
    verticalShift: 1,
    color: { r: 10, g: 49, b: 82 }, //bluish
  },

  commercial: {
    scale: 1.0,
    scaleH: 1.0,
    horizontalOffset: 0.7,
    verticalOffset: 0.3,
    verticalShift: 1,
    color: { r: 0, g: 49, b: 82 }, //bluish
  },

  recreational: {
    scale: 1,
    scaleH: 0.1,
    horizontalOffset: 1,
    verticalOffset: 1,
    verticalShift: 1,
    color: { r: 0, g: 49, b: 82 }, //bluish
  },

  offices: {
    scale: 0.6,
    scaleH: 1.0,
    horizontalOffset: 0.9,
    verticalOffset: 0.3,
    verticalShift: 1,
    color: { r: 0, g: 49, b: 82 }, //bluish
  },

  industrial: {
    scale: 1,
    scaleH: 2,
    horizontalOffset: 0.9,
    verticalOffset: 1,
    verticalShift: 1,
    color: { r: 0, g: 29, b: 48 }, //dark bluish
  },

  parking: {
    scale: 1,
    scaleH: 1.0,
    horizontalOffset: 0.9,
    verticalOffset: 1,
    verticalShift: 1,
    color: { r: 0, g: 49, b: 82 }, //bluish
  },

  institutional: {
    scale: 1.0,
    scaleH: 2,
    horizontalOffset: 0.9,
    verticalOffset: 1,
    verticalShift: 0,
    color: { r: 64, g: 44, b: 35 }, //brownish
  },

  services: {
    scale: 1.0,
    scaleH: 1.0,
    horizontalOffset: 1,
    verticalOffset: 0.3,
    verticalShift: 1,
    color: { r: 0, g: 49, b: 82 }, //bluish
  },

  default: {
    scale: 1.0,
    scaleH: 1.0,
    horizontalOffset: 1,
    verticalOffset: 0.3,
    verticalShift: 1,
    color: { r: 0, g: 49, b: 82 }, //bluish
  },
};
