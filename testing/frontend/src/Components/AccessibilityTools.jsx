import { useContext } from "react";
import { AccessibilityContext } from "../Context/AccessibilityContext";

function AccessibilityTools() {

  const {
    increaseFont,
    decreaseFont,
    toggleContrast,
    highContrast,
    fontScale
  } = useContext(AccessibilityContext);

  return (
    <div className="navbar-accessibility">

      <button
        onClick={increaseFont}
        aria-label="Aumentar tamaño de texto"
        disabled={fontScale >= 1.5}
      >
        A+
      </button>

      <button
        onClick={decreaseFont}
        aria-label="Disminuir tamaño de texto"
        disabled={fontScale <= 0.8}
      >
        A-
      </button>

      <button
        onClick={toggleContrast}
        aria-label="Activar o desactivar alto contraste"
        aria-pressed={highContrast}
      >
        ⬛
      </button>

    </div>
  );
}

export default AccessibilityTools;