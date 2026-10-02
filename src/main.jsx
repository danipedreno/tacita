import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { registerSW } from "virtual:pwa-register";

// App instalada: al abrirla o volver a ella se busca versión nueva; si la hay, se instala y la página se recarga
// sola (antes había que cerrarla dos veces). El progreso y los tests en curso se guardan en el dispositivo.
registerSW({
  immediate: true,
  onRegisteredSW(_url, reg) {
    if (!reg) return;
    const check = () => document.visibilityState === "visible" && navigator.onLine && reg.update().catch(() => {});
    document.addEventListener("visibilitychange", check);
    setInterval(check, 30 * 60 * 1000);
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
