// UserDropdown.test.jsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BrowserRouter } from "react-router-dom";
import UserDropdown from "../../src/Components/Navbar/UserDropdown";

describe("UserDropdown component", () => {

  const renderWithRouter = (ui) =>
    render(<BrowserRouter>{ui}</BrowserRouter>);

  const mockUser = {
    name: "Juan Pérez"
  };

  it("no renderiza nada si no hay usuario", () => {
    const { container } = renderWithRouter(
      <UserDropdown user={null} logout={vi.fn()} />
    );

    expect(container.firstChild).toBeNull();
  });

  it("renderiza el nombre del usuario", () => {
    renderWithRouter(
      <UserDropdown user={mockUser} logout={vi.fn()} />
    );

    expect(screen.getByText("Juan Pérez")).toBeInTheDocument();
  });

  it("abre y cierra el menú al hacer click en el botón", () => {
    renderWithRouter(
      <UserDropdown user={mockUser} logout={vi.fn()} />
    );

    const button = screen.getByRole("button", { name: /Juan Pérez/i });

    // abrir
    fireEvent.click(button);
    expect(screen.getByText("Panel Admin")).toBeInTheDocument();

    // cerrar
    fireEvent.click(button);
    expect(screen.queryByText("Panel Admin")).not.toBeInTheDocument();
  });

  it("cierra el menú al hacer click fuera", () => {
    renderWithRouter(
      <div>
        <UserDropdown user={mockUser} logout={vi.fn()} />
        <div data-testid="outside">Outside</div>
      </div>
    );

    const button = screen.getByRole("button", { name: /Juan Pérez/i });

    // abrir
    fireEvent.click(button);
    expect(screen.getByText("Panel Admin")).toBeInTheDocument();

    // click fuera
    fireEvent.click(screen.getByTestId("outside"));
    expect(screen.queryByText("Panel Admin")).not.toBeInTheDocument();
  });

  it("cierra el menú al hacer click en un link", () => {
    renderWithRouter(
      <UserDropdown user={mockUser} logout={vi.fn()} />
    );

    const button = screen.getByRole("button", { name: /Juan Pérez/i });

    fireEvent.click(button);

    const link = screen.getByText("Panel Admin");
    fireEvent.click(link);

    expect(screen.queryByText("Panel Admin")).not.toBeInTheDocument();
  });

  it("ejecuta logout al hacer click en 'Cerrar sesión'", () => {
    const mockLogout = vi.fn();

    renderWithRouter(
      <UserDropdown user={mockUser} logout={mockLogout} />
    );

    const button = screen.getByRole("button", { name: /Juan Pérez/i });

    fireEvent.click(button);

    const logoutBtn = screen.getByText("Cerrar sesión");
    fireEvent.click(logoutBtn);

    expect(mockLogout).toHaveBeenCalled();
  });

});