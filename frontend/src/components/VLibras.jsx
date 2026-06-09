import { useEffect } from "react";

export function VLibras({ enabled }) {
  useEffect(() => {
    if (!enabled) return;

    if (!document.getElementById("vlibras-widget")) {
      const wrapper = document.createElement("div");
      wrapper.id = "vlibras-widget";
      wrapper.setAttribute("vw", "");
      wrapper.className = "enabled";
      wrapper.innerHTML = `
        <div vw-access-button class="active"></div>
        <div vw-plugin-wrapper>
          <div class="vw-plugin-top-wrapper"></div>
        </div>
      `;
      document.body.appendChild(wrapper);
    }

    if (!document.getElementById("vlibras-script")) {
      const script = document.createElement("script");
      script.id = "vlibras-script";
      script.src = "https://vlibras.gov.br/app/vlibras-plugin.js";
      script.onload = () => {
        if (window.VLibras) {
          new window.VLibras.Widget("https://vlibras.gov.br/app");
        }
      };
      document.body.appendChild(script);
    } else if (window.VLibras) {
      new window.VLibras.Widget("https://vlibras.gov.br/app");
    }
  }, [enabled]);

  return null;
}
