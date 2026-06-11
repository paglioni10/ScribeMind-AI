import { createContext, useContext, useState, useEffect } from "react";

const AccessibilityContext = createContext(null);

export function AccessibilityProvider({ children }) {
  const [highContrast, setHighContrast] = useState(
    () => localStorage.getItem("sm_hc") === "1"
  );
  const [fontSize, setFontSize] = useState(
    () => localStorage.getItem("sm_fs") || "normal"
  );
  const [theme, setTheme] = useState(
    () => localStorage.getItem("sm_theme") || "dark"
  );

  useEffect(() => {
    document.documentElement.classList.toggle("high-contrast", highContrast);
    localStorage.setItem("sm_hc", highContrast ? "1" : "0");
  }, [highContrast]);

  useEffect(() => {
    document.documentElement.setAttribute("data-font-size", fontSize);
    localStorage.setItem("sm_fs", fontSize);
  }, [fontSize]);

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    localStorage.setItem("sm_theme", theme);
  }, [theme]);

  return (
    <AccessibilityContext.Provider
      value={{ highContrast, setHighContrast, fontSize, setFontSize, theme, setTheme }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export const useAccessibility = () => useContext(AccessibilityContext);
