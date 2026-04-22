// src/Components/Common/CanView.test.jsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
// ✅ CORRECCIÓN 1: Importamos jest-dom para usar toBeEmptyDOMElement y toBeInTheDocument
import "@testing-library/jest-dom/vitest"; 
import CanView from "../../src/Components/Common/CanView";

// ✅ CORRECCIÓN 2: Rutas limpias y correctas apuntando a src/
vi.mock("../../src/Context/AuthContext", () => ({
  useAuth: vi.fn()
}));

import { useAuth } from "../../src/Context/AuthContext";

describe("CanView component", () => {

  const Child = () => <div>Contenido visible</div>;

  it("no renderiza nada si no hay usuario", () => {
    // Usamos vi.mocked para asegurar que el mock se aplica correctamente
    vi.mocked(useAuth).mockReturnValue({ user: null });
    
    const { container } = render(
      <CanView requiredPermission="view_dashboard">
        <Child />
      </CanView>
    );
    
    expect(container).toBeEmptyDOMElement();
  });

  it("renderiza hijos si no se requiere permiso", () => {
    vi.mocked(useAuth).mockReturnValue({ user: { role: "user", permissions: [] } });
    
    render(
      <CanView>
        <Child />
      </CanView>
    );
    
    expect(screen.getByText("Contenido visible")).toBeInTheDocument();
  });

  it("renderiza hijos si el usuario es super_admin", () => {
    vi.mocked(useAuth).mockReturnValue({ user: { role: "super_admin", permissions: [] } });
    
    render(
      <CanView requiredPermission="anything">
        <Child />
      </CanView>
    );
    
    expect(screen.getByText("Contenido visible")).toBeInTheDocument();
  });

  it("renderiza hijos si el usuario tiene el permiso requerido", () => {
    vi.mocked(useAuth).mockReturnValue({ user: { role: "user", permissions: ["view_dashboard"] } });
    
    render(
      <CanView requiredPermission="view_dashboard">
        <Child />
      </CanView>
    );
    
    expect(screen.getByText("Contenido visible")).toBeInTheDocument();
  });

  it("no renderiza si el usuario no tiene el permiso requerido", () => {
    vi.mocked(useAuth).mockReturnValue({ user: { role: "user", permissions: ["other_permission"] } });
    
    const { container } = render(
      <CanView requiredPermission="view_dashboard">
        <Child />
      </CanView>
    );
    
    expect(container).toBeEmptyDOMElement();
  });
  
});