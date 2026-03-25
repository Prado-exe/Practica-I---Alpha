// AccessibilityTools.test.jsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import AccessibilityTools from "./AccessibilityTools";
import { AccessibilityContext } from "../Context/AccessibilityContext";

describe("AccessibilityTools component", () => {

  const renderWithContext = (contextValue) =>
    render(
      <AccessibilityContext.Provider value={contextValue}>
        <AccessibilityTools />
      </AccessibilityContext.Provider>
    );

  it("renderiza los botones correctamente", () => {
    renderWithContext({
      increaseFont: vi.fn(),
      decreaseFont: vi.fn(),
      toggleContrast: vi.fn(),
      highContrast: false,
      fontScale: 1
    });

    expect(screen.getByLabelText("Aumentar tamaño de texto")).toBeInTheDocument();
    expect(screen.getByLabelText("Disminuir tamaño de texto")).toBeInTheDocument();
    expect(screen.getByLabelText("Activar o desactivar alto contraste")).toBeInTheDocument();
  });

  it("llama a increaseFont al hacer click en A+", () => {
    const increaseFont = vi.fn();

    renderWithContext({
      increaseFont,
      decreaseFont: vi.fn(),
      toggleContrast: vi.fn(),
      highContrast: false,
      fontScale: 1
    });

    fireEvent.click(screen.getByText("A+"));
    expect(increaseFont).toHaveBeenCalled();
  });

  it("llama a decreaseFont al hacer click en A-", () => {
    const decreaseFont = vi.fn();

    renderWithContext({
      increaseFont: vi.fn(),
      decreaseFont,
      toggleContrast: vi.fn(),
      highContrast: false,
      fontScale: 1
    });

    fireEvent.click(screen.getByText("A-"));
    expect(decreaseFont).toHaveBeenCalled();
  });

  it("llama a toggleContrast al hacer click", () => {
    const toggleContrast = vi.fn();

    renderWithContext({
      increaseFont: vi.fn(),
      decreaseFont: vi.fn(),
      toggleContrast,
      highContrast: false,
      fontScale: 1
    });

    fireEvent.click(screen.getByLabelText("Activar o desactivar alto contraste"));
    expect(toggleContrast).toHaveBeenCalled();
  });

  it("deshabilita botón A+ cuando fontScale >= 1.5", () => {
    renderWithContext({
      increaseFont: vi.fn(),
      decreaseFont: vi.fn(),
      toggleContrast: vi.fn(),
      highContrast: false,
      fontScale: 1.5
    });

    expect(screen.getByText("A+")).toBeDisabled();
  });

  it("deshabilita botón A- cuando fontScale <= 0.8", () => {
    renderWithContext({
      increaseFont: vi.fn(),
      decreaseFont: vi.fn(),
      toggleContrast: vi.fn(),
      highContrast: false,
      fontScale: 0.8
    });

    expect(screen.getByText("A-")).toBeDisabled();
  });

  it("refleja el estado de alto contraste en aria-pressed", () => {
    renderWithContext({
      increaseFont: vi.fn(),
      decreaseFont: vi.fn(),
      toggleContrast: vi.fn(),
      highContrast: true,
      fontScale: 1
    });

    const button = screen.getByLabelText("Activar o desactivar alto contraste");
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

});