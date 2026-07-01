import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// ── Global Styles ─────────────────────────────────────────
import "./styles/global.css";

// ── App Root ──────────────────────────────────────────────
import App from "./App";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error(
    "[MemoraAI] Root element #root not found. Check your index.html.",
  );
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
