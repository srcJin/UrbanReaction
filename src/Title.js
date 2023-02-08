import { useState, useRef } from "react";

function Title() {

  const [result, setResult] = useState(0);

  return (
    <div className="Title">
      <div>
        <h1>Urban Reaction Alpha</h1>
      </div>
    </div>
  );
}

export default Title;
