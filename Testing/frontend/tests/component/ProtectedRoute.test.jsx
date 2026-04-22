import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ProtectedRoute from "../../src/Pages/Admin/ProtectedRoute";
// Importamos el hook real para poder modificar su retorno luego
import { useAuth } from "../../src/Context/AuthContext";

// 🔥 Mock de Navigate (Este estaba perfecto)
vi.mock("react-router-dom", () => ({
  Navigate: ({ to }) => <div data-testid="navigate">Redirect to {to}</div>
}));

// 🔥 Mock de AuthContext (✅ Ruta corregida añadiendo src/)
vi.mock("../../src/Context/AuthContext", () => ({
  useAuth: vi.fn()
}));

describe("ProtectedRoute", () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra loading mientras verifica sesión", () => {
    // ✅ Usamos vi.mocked para asignar el valor de retorno en cada test
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      loading: true
    });

    render(
      <ProtectedRoute>
        <div>Contenido</div>
      </ProtectedRoute>
    );

    // Usamos regex por si el texto tiene "..." o variaciones
    expect(screen.getByText(/Verificando permisos/i)).toBeInTheDocument();
  });

  it("redirige a /login si no hay usuario", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      loading: false
    });

    render(
      <ProtectedRoute>
        <div>Contenido</div>
      </ProtectedRoute>
    );

    expect(screen.getByTestId("navigate")).toHaveTextContent("Redirect to /login");
  });

  it("redirige a /login si no hay token", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {}, // Usuario sin token
      loading: false
    });

    render(
      <ProtectedRoute>
        <div>Contenido</div>
      </ProtectedRoute>
    );

    expect(screen.getByTestId("navigate")).toHaveTextContent("Redirect to /login");
  });

  it("permite acceso si no se requiere permiso", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { token: "123" },
      loading: false
    });

    render(
      <ProtectedRoute>
        <div>Contenido protegido</div>
      </ProtectedRoute>
    );

    expect(screen.getByText("Contenido protegido")).toBeInTheDocument();
  });

  it("permite acceso si el usuario tiene el permiso requerido", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        token: "123",
        permissions: ["admin.read", "admin.write"]
      },
      loading: false
    });

    render(
      <ProtectedRoute requiredPermission="admin.read">
        <div>Contenido permitido</div>
      </ProtectedRoute>
    );

    expect(screen.getByText("Contenido permitido")).toBeInTheDocument();
  });

  it("bloquea acceso si NO tiene el permiso requerido", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        token: "123",
        permissions: ["user.read"] // No tiene admin.read
      },
      loading: false
    });

    render(
      <ProtectedRoute requiredPermission="admin.read">
        <div>Contenido secreto</div>
      </ProtectedRoute>
    );

    expect(screen.getByTestId("navigate")).toHaveTextContent("Redirect to /");
  });

});