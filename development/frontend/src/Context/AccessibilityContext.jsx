import { createContext, useState, useEffect } from "react";

export const AccessibilityContext = createContext({
  fontScale: 1,
  highContrast: false,
  reducedMotion: false,
  increaseFont: () => {},
  decreaseFont: () => {},
  toggleContrast: () => {},
  toggleReducedMotion: () => {},
});

export default AccessibilityContext;

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

  const [reducedMotion, setReducedMotion] = useState(() => {
    return localStorage.getItem("reducedMotion") === "true";
  });

  useEffect(() => {
    document.documentElement.style.setProperty("--font-scale", fontScale);
    localStorage.setItem("fontScale", fontScale);
  }, [fontScale]);

  useEffect(() => {
    document.documentElement.classList.toggle("high-contrast", highContrast);
    localStorage.setItem("highContrast", highContrast);
  }, [highContrast]);

  useEffect(() => {
    document.documentElement.classList.toggle("reduced-motion", reducedMotion);
    localStorage.setItem("reducedMotion", reducedMotion);
  }, [reducedMotion]);

  const increaseFont = () => {
    setFontScale((prev) => Math.min(MAX_FONT_SCALE, prev + FONT_STEP));
  };

  const decreaseFont = () => {
    setFontScale((prev) => Math.max(MIN_FONT_SCALE, prev - FONT_STEP));
  };

  const toggleContrast = () => {
    setHighContrast((prev) => !prev);
  };

  const toggleReducedMotion = () => {
    setReducedMotion((prev) => !prev);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        fontScale,
        highContrast,
        reducedMotion,
        increaseFont,
        decreaseFont,
        toggleContrast,
        toggleReducedMotion,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}