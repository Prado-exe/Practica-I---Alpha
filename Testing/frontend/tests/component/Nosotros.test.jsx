import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Nosotros from "../../src/Pages/Public/Nosotros";
import "@testing-library/jest-dom/vitest"; // ✅ Aseguramos matchers

const renderWithRoute = (route) => {
  render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/nosotros" element={<Nosotros />} />
        <Route path="/nosotros/:section" element={<Nosotros />} />
      </Routes>
    </MemoryRouter>
  );
};

describe("Componente Nosotros", () => {
  
it("renderiza el menú lateral correctamente", () => {
    renderWithRoute("/nosotros/quienes-somos");

    // 1. Título del sidebar
    expect(screen.getByText(/Sobre Nosotros/i)).toBeInTheDocument();
    
    // 2. ✅ CORRECCIÓN: Buscamos específicamente los enlaces del menú
    // Usamos 'getByRole' para diferenciar el link del sidebar del H1 del contenido
    expect(screen.getByRole("link", { name: /Quiénes somos/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Objetivos/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Misión y visión/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Principios/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Equipo/i })).toBeInTheDocument();
  });

  it("muestra el contenido de Quiénes somos por defecto", () => {
    renderWithRoute("/nosotros/quienes-somos");
    const mainTitle = screen.getByRole("heading", { level: 1 });
    expect(mainTitle).toHaveTextContent(/Quiénes somos/i);
    expect(screen.getByText(/Observatorio de Datos Sostenibles/i)).toBeInTheDocument();
  });

  it("usa fallback si la sección no existe", () => {
    renderWithRoute("/nosotros/seccion-inexistente");
    const title = screen.getByRole("heading", { level: 1 });
    expect(title).toHaveTextContent(/Quiénes somos/i);
  });

  it("cambia el contenido al navegar a otra sección", () => {
    renderWithRoute("/nosotros/objetivos");
    const title = screen.getByRole("heading", { level: 1 });
    expect(title).toHaveTextContent(/Objetivos/i);
  });

  it("encuentra la sección de Misión y Visión", () => {
    renderWithRoute("/nosotros/mision-vision");
    const title = screen.getByRole("heading", { level: 1 });
    expect(title).toHaveTextContent(/Misión y visión/i);
  });
});