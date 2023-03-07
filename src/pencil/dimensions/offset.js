class Offset {
  //creates a dimension object with the properties
  constructor(index, midPoint, parent, updateLineOffset, width = 3) {
    this.position = midPoint;
    this.width = width; // default
    this.parent = parent;
    this.index = index;
    this.updateLineOffset = updateLineOffset;

    this.newOffset = document.createElement('div');
    this.newOffset.classList.add('dim-in');
    // this.newOffset.classList.add('dim-' + index);

    const textDiv = document.createElement('input');
    textDiv.type = 'text';
    textDiv.classList.add('dim-text');

    textDiv.value = `w ${this.width.toFixed(2)} m`;
    var element = document.getElementById(parent);
    this.newOffset.appendChild(textDiv);
    element.appendChild(this.newOffset);

    textDiv.addEventListener('input', (event) => {
      event.target.value = event.target.value.replace(/[^0-9]/g, '');
    });

    textDiv.addEventListener('keydown', (event) => this.handleEnter(event, this));
  }

  handleEnter(event, width) {
    const scope = this;
    if (event.key === 'Enter') {
      scope.width = parseFloat(event.target.value);
      event.target.value = `w ${parseFloat(scope.width).toFixed(2)} m`;
      scope.updateLineOffset(scope.width, scope.index);
    }
  }

  //set visibility to true for dimension
  show() {
    this.newOffset.classList.remove('hide');
    // this.newOffset.classList.add('visible');
  }

  //set visibility to false for dimension
  hide() {
    this.newOffset.classList.add('hide');
    // this.newOffset.classList.remove('visible');
  }

  clear() {
    var element = document.getElementById(this.parent);
    element.removeChild(this.newOffset);
  }

  //sets the positions for dimension
  setOffsetPosition(screenPosition) {
    // this.newOffset.classList.add('visible');
    const translateX = screenPosition.x * window.innerWidth * 0.5;
    const translateY = -screenPosition.y * window.innerHeight * 0.5;
    this.newOffset.style.transform = `translateX(${translateX}px) translateY(${translateY}px)`;
    this.newOffset.children[0].innerHTML = this.width;
  }
}

export default Offset;
