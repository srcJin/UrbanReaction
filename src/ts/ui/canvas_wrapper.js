import Util from '../util';
console.log("--------------------");
console.log("canvas_wrapper.ts is running");
/**
 * Thin wrapper around HTML canvas, abstracts drawing functions so we can use the RoughJS canvas or the default one
 */
export default class CanvasWrapper {
    constructor(canvas, _scale = 1, resizeToWindow = true) {
        this.canvas = canvas;
        this._scale = _scale;
        this.needsUpdate = false;
        this.setDimensions();
        this.resizeCanvas();
        if (resizeToWindow) {
            window.addEventListener('resize', () => {
                this.setDimensions();
                this.resizeCanvas();
            });
        }
    }
    setDimensions() {
        this._width = window.innerWidth * this._scale;
        this._height = window.innerHeight * this._scale;
    }
    get width() {
        return this._width;
    }
    get height() {
        return this._height;
    }
    get canvasScale() {
        return this._scale;
    }
    set canvasScale(s) {
        this._scale = s;
        this.setDimensions();
        this.resizeCanvas();
    }
    zoomVectors(vs) {
        if (this._scale === 1)
            return vs;
        return vs.map(v => v.clone().multiplyScalar(this._scale));
    }
    resizeCanvas() {
        // Jin 20221212: When combining the two program, it can't read the canvas width and height
        // So I manually assigned one, ipad pro 12.9 1366*1024
        this.canvas.width = this._width;
        // this.canvas.width = 1366;
        //console.log("this.canvas.width",this.canvas.width)
        this.canvas.height = this._height;
        // this.canvas.height = 1024;
        //console.log("this._height",this._height)
        this.needsUpdate = true;
    }
}
export class DefaultCanvasWrapper extends CanvasWrapper {
    constructor(canvas, scale = 1, resizeToWindow = true) {
        super(canvas, scale, resizeToWindow);
        this.ctx = canvas.getContext("2d");
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    }
    // createSVG(svgElement: any): void {
    //     super.createSVG(svgElement);
    //     this.svg = SVG(svgElement);
    // }
    setFillStyle(colour) {
        this.ctx.fillStyle = colour;
    }
    clearCanvas() {
        if (this.svgNode) {
            // Expanded to cover whole drawn area
            const startW = window.innerWidth * (Util.DRAW_INFLATE_AMOUNT - 1) / 2;
            const startH = window.innerHeight * (Util.DRAW_INFLATE_AMOUNT - 1) / 2;
            this.drawRectangle(-startW, -startH, window.innerWidth * Util.DRAW_INFLATE_AMOUNT, window.innerHeight * Util.DRAW_INFLATE_AMOUNT);
        }
        else {
            this.drawRectangle(0, 0, window.innerWidth, window.innerHeight);
        }
    }
    drawFrame(left, right, up, down) {
        this.drawRectangle(0, 0, this._width / this._scale, up);
        this.drawRectangle(0, 0, left, this._height / this._scale);
        this.drawRectangle(this._width / this._scale - right, 0, right, this._height / this._scale);
        this.drawRectangle(0, this._height / this._scale - down, this._width / this._scale, down);
    }
    drawCityName() {
        const fontSize = 50 * this._scale;
        this.ctx.font = `small-caps ${fontSize}px Verdana`;
        this.ctx.textAlign = "center";
        this.ctx.fillText("san francisco", this._width / 2, this._height - (80 * this._scale - fontSize));
    }
    drawRectangle(x, y, width, height) {
        if (this._scale !== 1) {
            x *= this._scale;
            y *= this._scale;
            width *= this._scale;
            height *= this._scale;
        }
        this.ctx.fillRect(x, y, width, height);
        if (this.svg) {
            this.svg.rect({
                fill: this.ctx.fillStyle,
                'fill-opacity': 1,
                stroke: this.ctx.strokeStyle,
                'stroke-width': this.ctx.lineWidth,
                x: x,
                y: y,
                width: width,
                height: height,
            });
        }
    }
    drawPolygon(polygon) {
        if (polygon.length === 0) {
            return;
        }
        polygon = this.zoomVectors(polygon);
        this.ctx.beginPath();
        this.ctx.moveTo(polygon[0].x, polygon[0].y);
        for (let i = 1; i < polygon.length; i++) {
            this.ctx.lineTo(polygon[i].x, polygon[i].y);
        }
        this.ctx.lineTo(polygon[0].x, polygon[0].y);
        this.ctx.fill();
        this.ctx.stroke();
        if (this.svg) {
            const vectorArray = polygon.map(v => [v.x, v.y]);
            vectorArray.push(vectorArray[0]);
            this.svg.polyline(vectorArray).attr({
                fill: this.ctx.fillStyle,
                'fill-opacity': 1,
                stroke: this.ctx.strokeStyle,
                'stroke-width': this.ctx.lineWidth,
            });
        }
    }
    // has bug, don't know why, will replace by Three
    drawCircle(centre, radius) {
        const TAU = 2 * Math.PI;
        this.ctx.beginPath();
        // console.log("center.x=",centre.x)
        this.ctx.arc(centre.x, centre.y, radius, 0, TAU);
        this.ctx.fill();
    }
    drawSquare(centre, radius) {
        this.drawRectangle(centre.x - radius, centre.y - radius, 2 * radius, 2 * radius);
    }
    setLineWidth(width) {
        if (this._scale !== 1) {
            width *= this._scale;
        }
        this.ctx.lineWidth = width;
    }
    setStrokeStyle(colour) {
        this.ctx.strokeStyle = colour;
    }
    drawPolyline(line) {
        if (line.length < 2) {
            return;
        }
        line = this.zoomVectors(line);
        this.ctx.beginPath();
        this.ctx.moveTo(line[0].x, line[0].y);
        for (let i = 1; i < line.length; i++) {
            this.ctx.lineTo(line[i].x, line[i].y);
        }
        this.ctx.stroke();
        if (this.svg) {
            const vectorArray = line.map(v => [v.x, v.y]);
            this.svg.polyline(vectorArray).attr({
                'fill-opacity': 0,
                stroke: this.ctx.strokeStyle,
                'stroke-width': this.ctx.lineWidth,
            });
        }
    }
}
// export class RoughCanvasWrapper extends CanvasWrapper {
// private r = require('roughjs/bundled/rough.cjs');
// private rc: any;
// private options: RoughOptions = {
//     roughness: 1,
//     bowing: 1,
//     stroke: '#000000',
//     strokeWidth: 1,
//     fill: '#000000',
//     fillStyle: 'solid',
// };
// constructor(canvas: HTMLCanvasElement, scale=1, resizeToWindow=true) {
//     super(canvas, scale, resizeToWindow);
//     this.rc = this.r.canvas(canvas);
// }
// createSVG(svgElement: any): void {
//     super.createSVG(svgElement);
//     this.rc = this.r.svg(this.svgNode);
// }
// drawFrame(left: number, right: number, up: number, down: number): void {
// }
// setOptions(options: RoughOptions): void {
//     if (options.strokeWidth) {
//         options.strokeWidth *= this._scale;
//     }
//     Object.assign(this.options, options);
// }
// clearCanvas(): void {
//     if (this.svgNode) {
//         // Expanded to cover whole drawn area
//         const startW = window.innerWidth * (Util.DRAW_INFLATE_AMOUNT - 1) / 2;
//         const startH = window.innerHeight * (Util.DRAW_INFLATE_AMOUNT - 1) / 2;
//         this.drawRectangle(-startW, -startH, window.innerWidth * Util.DRAW_INFLATE_AMOUNT, window.innerHeight * Util.DRAW_INFLATE_AMOUNT);
//     } else {
//         this.drawRectangle(0, 0, window.innerWidth, window.innerHeight);
//     }
// }
// drawRectangle(x: number, y: number, width: number, height: number): void {
//     if (this._scale !== 1) {
//         x *= this._scale;
//         y *= this._scale;
//         width *= this._scale;
//         height *= this._scale;
//     }
//     this.appendSvgNode(this.rc.rectangle(x, y, width, height, this.options));
// }
// drawPolygon(polygon: Vector[]): void {
//     if (polygon.length === 0) {
//         return;
//     }
//     if (this._scale !== 1) {
//         polygon = polygon.map(v => v.clone().multiplyScalar(this._scale));
//     }
//     this.appendSvgNode(this.rc.polygon(polygon.map(v => [v.x, v.y]), this.options));
// }
//     drawSquare(centre: Vector, radius: number): void {
//         const prevStroke = this.options.stroke;
//         this.options.stroke = 'none';
//         this.drawRectangle(centre.x - radius, centre.y - radius, 2 * radius, 2 * radius);
//         this.options.stroke = prevStroke;
//     }
//     drawPolyline(line: Vector[]): void {
//         if (line.length < 2) {
//             return;
//         }
//         if (this._scale !== 1) {
//             line = line.map(v => v.clone().multiplyScalar(this._scale));
//         }
//         this.appendSvgNode(this.rc.linearPath(line.map(v => [v.x, v.y]), this.options));
//     }
// }
