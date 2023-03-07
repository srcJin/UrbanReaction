class Dimension {
  //creates a dimension object with the properties
  constructor(dimIndex, midPoint, distanceBetween, parent, style = 'default') {
    this.newDim = document.createElement('div');
    this.newDim.classList.add(style === 'default' ? 'dim' : 'dimArea');
    // this.newDim.classList.add('dim-' + dimIndex);

    const textDiv = document.createElement('div');
    textDiv.classList.add('text');
    const text = document.createTextNode('');
    textDiv.appendChild(text);

    const element = document.getElementById(parent);

    this.newDim.appendChild(textDiv);
    element.appendChild(this.newDim);

    this.position = midPoint;
    this.measure = style === 'default' ? distanceBetween + ' m' : distanceBetween + ' m²';
    this.parent = parent;
    this.index = dimIndex;
  }

  setPosition(position) {
    this.position = position;
  }

  setMeasure(measure) {
    this.measure = measure;
  }

  //set visibility to true for dimension
  show() {
    this.newDim.classList.add('visible');
  }

  //set visibility to false for dimension
  hide() {
    this.newDim.classList.remove('visible');
  }

  clear() {
    var element = document.getElementById(this.parent);
    element.removeChild(this.newDim);
  }

  //sets the positions for dimension
  setDimPosition(screenPosition) {
    this.newDim.classList.add('visible');
    const translateX = screenPosition.x * window.innerWidth * 0.5;
    const translateY = -screenPosition.y * window.innerHeight * 0.5;
    this.newDim.style.transform = `translateX(${translateX}px) translateY(${translateY}px)`;
    this.newDim.children[0].innerHTML = this.measure;
  }
}

export default Dimension;
