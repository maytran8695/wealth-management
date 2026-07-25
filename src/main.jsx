import React from "react";
import ReactDOM from "react-dom/client";
import "./storage.js";
import "./index.css";
import WealthCompass from "./wealth-compass.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <WealthCompass />
  </React.StrictMode>
);
