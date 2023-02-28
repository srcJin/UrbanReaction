import { useState, useRef } from "react";
import "./Buttons.css";

// the buttons is a parent component
// the canvas is a child component

// this is a functional way to create react conponents
// Notice that we didn't declare a class, 
// but rather defined a simple function called Button. 
// This is the functional way of creating React components. 
// In fact, when the purpose of your component is purely 
// to render some user interface elements with or without any props, 
// then it's recommended that you use this approach.


function Buttons() {
  const inputRef = useRef(null);
  const [setResult] = useState(0);

  function plus(e) {
    e.preventDefault();
    setResult((result) => result + Number(inputRef.current.value));

  }

  function refresh(e) {
    console.log("hello refresh")
  }


  return (
    <div className="Buttons">
      {/* <form> */}
        <input
          pattern="[0-9]"
          ref={inputRef}
          type="number"
          placeholder="number input 1"
        />
          <input
          pattern="[0-9]"
          ref={inputRef}
          type="number"
          placeholder="number input 2"
        />

        {/* jsx codes */}

        <button onClick={plus}>pencil</button>
        <button onClick={plus}>eraser</button>
        <button onClick={plus}>axis</button>
        <button onClick={plus}>line</button>
        <button onClick={plus}>curve</button>
        <button onClick={plus}>star</button>
        <button onClick={refresh}>refresh</button>

      {/* </form> */}
    </div>
  );
}

export default Buttons;
