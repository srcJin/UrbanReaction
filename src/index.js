
import React from "react";
import ReactDOM from "react-dom/client";

// the index is a parent component
// other things are child component
// the canvas is a child of the buttons

import Title from './Title';
import Buttons from './Buttons';
import {Canvas} from './Canvas';
import './style.css';
import Spacer from './Spacer';
import LikeButton from './MyButtons';
import {RefreshButton} from './MyButtons';
const root1 = ReactDOM.createRoot(document.getElementById('root1'));
const root2 = ReactDOM.createRoot(document.getElementById('root2'));
const root3 = ReactDOM.createRoot(document.getElementById('root3'));
const root4 = ReactDOM.createRoot(document.getElementById('root4'));
const root5 = ReactDOM.createRoot(document.getElementById('root5'));
const root6 = ReactDOM.createRoot(document.getElementById('root6'));

root1.render(<Title/>)
root2.render(<Buttons />);
root3.render(<Spacer />);
root4.render(<Canvas />);
root5.render(<LikeButton />);
root6.render(<RefreshButton />);


