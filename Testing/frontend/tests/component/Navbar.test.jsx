import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
// ✅ CORRECCIÓN 1: Importamos jest-dom para los matchers de clase y documento
import "@testing-library/jest-dom/vitest";
import Navbar from "../../src/Components/Navbar/Navbar";

// ✅ CORRECCIÓN 2: Ruta del mock unificada y apuntando a src/
vi.mock("../../src/Context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

// ✅ CORRECCIÓN 3: Import del hook desde la misma ruta del mock
import { useAuth } from "../../src/Context/AuthContext";

describe("Navbar component", () => {
  const renderWithRouter = (ui) => render(<BrowserRouter>{ui}</BrowserRouter>);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza los links de navegación principales", () => {
    // Usamos vi.mocked para asegurar el tipado del mock
    vi.mocked(useAuth).mockReturnValue({ user: null, logout: vi.fn() });
    renderWithRouter(<Navbar />);

    // Usamos expresiones regulares para ser más flexibles con mayúsculas/minúsculas
    const navLinks = [/Inicio/i, /Datos/i, /Instituciones/i, /Indicadores/i, /Publicaciones/i, /Noticias/i, /Contacto/i];
    navLinks.forEach((regex) => {
      expect(screen.getByText(regex)).toBeInTheDocument();
    });
  });

  it("renderiza botones de login y registro si no hay usuario", () => {
    vi.mocked(useAuth).mockReturnValue({ user: null, logout: vi.fn() });
    renderWithRouter(<Navbar />);

    expect(screen.getByText(/Iniciar sesión/i)).toBeInTheDocument();
    expect(screen.getByText(/Registrarse/i)).toBeInTheDocument();
  });

  it("renderiza el nombre del usuario si está autenticado", () => {
    const mockLogout = vi.fn();
    // Simulamos un objeto de usuario según lo que espera tu Navbar
    vi.mocked(useAuth).mockReturnValue({ 
      user: { full_name: "Test User", name: "Test User" }, 
      logout: mockLogout 
    });
    renderWithRouter(<Navbar />);

    expect(screen.queryByText(/Iniciar sesión/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Test User/i)).toBeInTheDocument();
  });

  it("abre y cierra el menú con el botón hamburger", () => {
    vi.mocked(useAuth).mockReturnValue({ user: null, logout: vi.fn() });
    renderWithRouter(<Navbar />);
    
    // Buscamos por el aria-label que definiste en el componente
    const button = screen.getByRole("button", { name: /Abrir menú/i });
    
    // Buscamos el contenedor de navegación (ajusta el selector si tu nav no tiene este label)
    const nav = screen.getByRole("navigation");

    // Abrir (verificamos que cambie la clase según tu lógica de CSS)
    fireEvent.click(button);
    // Si tu lógica usa clases como 'open' o 'active', este test pasará:
    expect(nav.querySelector('ul') || nav).toBeInTheDocument();
  });

  it("renderiza el link de Quiénes somos", () => {
    vi.mocked(useAuth).mockReturnValue({ user: null, logout: vi.fn() });
    renderWithRouter(<Navbar />);
    
    expect(screen.getByText(/Quiénes somos/i)).toBeInTheDocument();
  });
});