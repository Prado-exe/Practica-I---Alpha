// DropdownMenu.test.jsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BrowserRouter } from "react-router-dom";
import DropdownMenu from "./DropdownMenu";

describe("DropdownMenu component", () => {
  const links = [
    { path: "/objetivo", label: "Objetivo estratégico" },
    { path: "/mision", label: "Visión y misión" },
  ];

  const renderWithRouter = (ui) => render(<BrowserRouter>{ui}</BrowserRouter>);

  it("renderiza los links correctamente", () => {
    renderWithRouter(<DropdownMenu links={links} />);
    
    // los links no se ven inicialmente
    links.forEach((link) => {
      expect(screen.queryByText(link.label)).toBeInTheDocument();
    });
  });

  it("abre y cierra el menú al hacer click en el botón", () => {
    renderWithRouter(<DropdownMenu links={links} />);
    const button = screen.getByRole("button", { name: /Sobre nosotros/i });

    // inicialmente cerrado
    expect(button).toHaveAttribute("aria-expanded", "false");

    // abrir
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");

    // cerrar
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("abre el menú con hover y cierra al salir", () => {
    renderWithRouter(<DropdownMenu links={links} />);
    const dropdown = screen.getByRole("button", { name: /Sobre nosotros/i }).parentElement;

    fireEvent.mouseEnter(dropdown);
    expect(dropdown).toHaveClass("open");

    fireEvent.mouseLeave(dropdown);
    expect(dropdown).not.toHaveClass("open");
  });

  it("cierra el menú al presionar Escape", () => {
    renderWithRouter(<DropdownMenu links={links} />);
    const button = screen.getByRole("button", { name: /Sobre nosotros/i });

    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");

    fireEvent.keyDown(window, { key: "Escape" });
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("cierra el menú al hacer click fuera", () => {
    renderWithRouter(
      <div>
        <DropdownMenu links={links} />
        <div data-testid="outside">Outside</div>
      </div>
    );

    const button = screen.getByRole("button", { name: /Sobre nosotros/i });
    const outside = screen.getByTestId("outside");

    // abrir
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");

    // click afuera
    fireEvent.mouseDown(outside);
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("cierra el menú al hacer click en un link", () => {
    renderWithRouter(<DropdownMenu links={links} />);
    const button = screen.getByRole("button", { name: /Sobre nosotros/i });

    fireEvent.click(button);
    const link = screen.getByRole("menuitem", { name: /Objetivo estratégico/i });

    fireEvent.click(link);
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

});