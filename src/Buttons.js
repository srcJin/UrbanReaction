import { useState, useRef } from "react";
import "./Buttons.css";

function Buttons() {
  const inputRef = useRef(null);
  const resultRef = useRef(null);
  const [result, setResult] = useState(0);

  function plus(e) {
    e.preventDefault();
    setResult((result) => result + Number(inputRef.current.value));
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
        <button onClick={plus}>reset</button>
      {/* </form> */}
    </div>
  );
}

export default Buttons;
