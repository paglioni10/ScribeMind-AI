import { useEffect } from "react";

// O widget VLibras é construído (visível) em index.html, garantindo que ele
// calcule o layout corretamente. Aqui só controlamos a visibilidade.
export function VLibras({ enabled }) {
  useEffect(() => {
    const widget = document.getElementById("vlibras-widget");
    if (!widget) return;

    widget.style.display = enabled ? "block" : "none";
  }, [enabled]);

  return null;
}
