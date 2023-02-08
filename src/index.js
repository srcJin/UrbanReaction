
import React, { Component } from "react";
import ReactDOM from "react-dom/client";

import Title from './Title';
import Buttons from './Buttons';
import Canvas from './Canvas';
import './style.css';
import Spacer from './Spacer';

const root1 = ReactDOM.createRoot(document.getElementById('root1'));
const root2 = ReactDOM.createRoot(document.getElementById('root2'));
const root3 = ReactDOM.createRoot(document.getElementById('root3'));
const root4 = ReactDOM.createRoot(document.getElementById('root4'));

root1.render(<Title/>)
root2.render(<Buttons />);
root3.render(<Spacer />);
root4.render(<Canvas />);



