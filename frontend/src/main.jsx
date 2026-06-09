import React from "react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

const root = createRoot(document.getElementById("root"));

// axe-core audita acessibilidade em dev e loga violações no console
if (import.meta.env.DEV) {
  import("@axe-core/react").then(({ default: axe }) => {
    axe(React, { createRoot }, 1000);
  });
}

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
