class Annotation {
  constructor(dimIndex, midPoint, parent, label, style = 'default') {
    this.newDim = document.createElement('div');
    this.newDim.classList.add('plotAnnotation');

    const textDiv = document.createElement('div');
    textDiv.classList.add('text');
    const text = document.createTextNode('xxx');
    textDiv.appendChild(text);

    const element = document.getElementById(parent);

    this.newDim.appendChild(textDiv);
    element.appendChild(this.newDim);

    this.position = midPoint;
    this.index = dimIndex;
    this.parent = parent;
    this.setLabels(label);
  }

  setPosition(position) {
    this.position = position;
  }

  setLabels(label) {
    this.label = label;
    this.newDim.children[0].innerHTML = this.label;
  }

  show() {
    this.newDim.classList.add('visible');
  }

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
    // this.newDim.children[0].innerHTML = this.label;
  }
}

export default Annotation;
