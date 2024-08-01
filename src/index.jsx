import React from "react";
import ReactDOM from "react-dom/client"; // note the 'client' part
import { BrowserRouter as Router } from "react-router-dom";
import App from "./App";
import "./styles/root.less";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
    <Router>
      <App />
    </Router>
);
