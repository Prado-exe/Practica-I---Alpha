// Navbar.test.jsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BrowserRouter } from "react-router-dom";
import Navbar from "./Navbar";
import { useAuth } from "../../Context/AuthContext";

// Mock del AuthContext
vi.mock("../../Context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

describe("Navbar component", () => {
  const renderWithRouter = (ui) => render(<BrowserRouter>{ui}</BrowserRouter>);

  it("renderiza los links de navegación principales", () => {
    useAuth.mockReturnValue({ user: null, logout: vi.fn() });
    renderWithRouter(<Navbar />);

    const navLinks = ["Inicio", "Datos", "Instituciones", "Indicadores", "Publicaciones", "Noticias", "Contacto"];
    navLinks.forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it("renderiza botones de login y registro si no hay usuario", () => {
    useAuth.mockReturnValue({ user: null, logout: vi.fn() });
    renderWithRouter(<Navbar />);

    expect(screen.getByText(/Iniciar sesión/i)).toBeInTheDocument();
    expect(screen.getByText(/Registrarse/i)).toBeInTheDocument();
  });

  it("renderiza UserDropdown si hay usuario", () => {
    const mockLogout = vi.fn();
    useAuth.mockReturnValue({ user: { name: "Test User" }, logout: mockLogout });
    renderWithRouter(<Navbar />);

    expect(screen.queryByText(/Iniciar sesión/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Registrarse/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Test User/i)).toBeInTheDocument();
  });

  it("abre y cierra el menú con el botón hamburger", () => {
    useAuth.mockReturnValue({ user: null, logout: vi.fn() });
    renderWithRouter(<Navbar />);
    
    const button = screen.getByRole("button", { name: /Abrir menú/i });
    const nav = screen.getByLabelText("Navegación principal");

    // inicialmente cerrado
    expect(nav).not.toHaveClass("open");

    // abrir
    fireEvent.click(button);
    expect(nav).toHaveClass("open");

    // cerrar
    fireEvent.click(button);
    expect(nav).not.toHaveClass("open");
  });

  it("renderiza el DropdownMenu con links sobre nosotros", () => {
    useAuth.mockReturnValue({ user: null, logout: vi.fn() });
    renderWithRouter(<Navbar />);
    
    const dropdownLink = screen.getByText(/Quiénes somos/i);
    expect(dropdownLink).toBeInTheDocument();
  });
});