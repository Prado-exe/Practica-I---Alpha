import { createContext, useState, useEffect } from "react";



export const AccessibilityContext = createContext();

export function AccessibilityProvider({ children }) {
  const MIN_FONT_SCALE = 0.8;
  const MAX_FONT_SCALE = 1.5;
  const FONT_STEP = 0.1;

  const [fontScale, setFontScale] = useState(() => {
    return Number(localStorage.getItem("fontScale")) || 1;
  });

  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem("highContrast") === "true";
  });

  useEffect(() => {
    document.documentElement.style.setProperty("--font-scale", fontScale);
    localStorage.setItem("fontScale", fontScale);
  }, [fontScale]);

  useEffect(() => {
    document.documentElement.classList.toggle("high-contrast", highContrast);
    localStorage.setItem("highContrast", highContrast);
  }, [highContrast]);

  return (
    <AccessibilityContext.Provider
      value={{
        increaseFont: () => setFontScale(prev => Math.min(MAX_FONT_SCALE, prev + FONT_STEP)),
        decreaseFont: () => setFontScale(prev => Math.max(MIN_FONT_SCALE, prev - FONT_STEP)),
        toggleContrast: () => setHighContrast(prev => !prev)
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}