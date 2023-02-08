import React, { Component } from "react";

class Canvas extends Component {
  componentDidMount() {















    
  }
  render() {
    return (
      // mount the canvas inside of React
      // attach the Three.js renderer to the React Element utilizing a ref.
      <div ref={(ref) => (this.mount = ref)} />
    );
  }
}

export default Canvas;
