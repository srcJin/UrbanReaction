
import React from "react";
import ReactDOM from "react-dom/client";

// the index is a parent component
// other things are child component
// the canvas is a child of the buttons

import Title from './Title';
import {Canvas} from './Generator';
import './style.css';
import Spacer from './Spacer';
import {NumberInputs,ToolButtons} from './MyTools';


const root1 = ReactDOM.createRoot(document.getElementById('root1'));
const root2 = ReactDOM.createRoot(document.getElementById('root2'));
const root3 = ReactDOM.createRoot(document.getElementById('root3'));
const root4 = ReactDOM.createRoot(document.getElementById('root4'));
const root5 = ReactDOM.createRoot(document.getElementById('root5'));
const root6 = ReactDOM.createRoot(document.getElementById('root6'));
const root7 = ReactDOM.createRoot(document.getElementById('root7'));
const root8 = ReactDOM.createRoot(document.getElementById('root8'));

root1.render(<Title/>)
root2.render(<ToolButtons />);
root3.render(<Spacer />);
root4.render(<Canvas />);


