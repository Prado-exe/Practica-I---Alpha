// AccessibilityProvider.test.jsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { AccessibilityProvider, AccessibilityContext } from "./AccessibilityContext";
import { useContext } from "react";

// 🔥 componente helper para consumir el context
function TestComponent() {
  const {
    fontScale,
    highContrast,
    reducedMotion,
    increaseFont,
    decreaseFont,
    toggleContrast,
    toggleReducedMotion,
  } = useContext(AccessibilityContext);

  return (
    <div>
      <span data-testid="font">{fontScale}</span>
      <span data-testid="contrast">{String(highContrast)}</span>
      <span data-testid="motion">{String(reducedMotion)}</span>

      <button onClick={increaseFont}>A+</button>
      <button onClick={decreaseFont}>A-</button>
      <button onClick={toggleContrast}>contrast</button>
      <button onClick={toggleReducedMotion}>motion</button>
    </div>
  );
}

describe("AccessibilityProvider", () => {

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
    document.documentElement.style.cssText = "";
  });

  it("usa valores por defecto si localStorage está vacío", () => {
    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    );

    expect(screen.getByTestId("font").textContent).toBe("1");
    expect(screen.getByTestId("contrast").textContent).toBe("false");
    expect(screen.getByTestId("motion").textContent).toBe("false");
  });

  it("lee valores desde localStorage", () => {
    localStorage.setItem("fontScale", "1.3");
    localStorage.setItem("highContrast", "true");
    localStorage.setItem("reducedMotion", "true");

    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    );

    expect(screen.getByTestId("font").textContent).toBe("1.3");
    expect(screen.getByTestId("contrast").textContent).toBe("true");
    expect(screen.getByTestId("motion").textContent).toBe("true");
  });

  it("increaseFont aumenta el tamaño hasta el máximo", () => {
    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    );

    const btn = screen.getByText("A+");

    fireEvent.click(btn);
    fireEvent.click(btn);
    fireEvent.click(btn);
    fireEvent.click(btn);
    fireEvent.click(btn);

    expect(Number(screen.getByTestId("font").textContent)).toBeLessThanOrEqual(1.5);
  });

  it("decreaseFont disminuye hasta el mínimo", () => {
    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    );

    const btn = screen.getByText("A-");

    fireEvent.click(btn);
    fireEvent.click(btn);
    fireEvent.click(btn);
    fireEvent.click(btn);

    expect(Number(screen.getByTestId("font").textContent)).toBeGreaterThanOrEqual(0.8);
  });

  it("toggleContrast cambia el estado", () => {
    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    );

    const btn = screen.getByText("contrast");

    fireEvent.click(btn);
    expect(screen.getByTestId("contrast").textContent).toBe("true");

    fireEvent.click(btn);
    expect(screen.getByTestId("contrast").textContent).toBe("false");
  });

  it("toggleReducedMotion cambia el estado", () => {
    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    );

    const btn = screen.getByText("motion");

    fireEvent.click(btn);
    expect(screen.getByTestId("motion").textContent).toBe("true");
  });

  it("actualiza el DOM (CSS variable) cuando cambia fontScale", () => {
    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    );

    fireEvent.click(screen.getByText("A+"));

    expect(document.documentElement.style.getPropertyValue("--font-scale"))
      .not.toBe("");
  });

  it("aplica clase high-contrast al DOM", () => {
    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    );

    fireEvent.click(screen.getByText("contrast"));

    expect(document.documentElement.classList.contains("high-contrast"))
      .toBe(true);
  });

  it("guarda cambios en localStorage", () => {
    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    );

    fireEvent.click(screen.getByText("A+"));

    expect(localStorage.getItem("fontScale")).not.toBe(null);
  });

});