import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ProtectedRoute from "../../src/Pages/Admin/ProtectedRoute";

// 🔥 Mock de Navigate
vi.mock("react-router-dom", () => ({
  Navigate: ({ to }) => <div data-testid="navigate">Redirect to {to}</div>
}));

// 🔥 Mock dinámico de useAuth
const mockUseAuth = vi.fn();

vi.mock("../../Context/AuthContext", () => ({
  useAuth: () => mockUseAuth()
}));

describe("ProtectedRoute", () => {

  it("muestra loading mientras verifica sesión", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true
    });

    render(
      <ProtectedRoute>
        <div>Contenido</div>
      </ProtectedRoute>
    );

    expect(screen.getByText("Verificando permisos...")).toBeInTheDocument();
  });

  it("redirige a /login si no hay usuario", () => {
    mockUseAuth.mockReturnValue({
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
    mockUseAuth.mockReturnValue({
      user: {},
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
    mockUseAuth.mockReturnValue({
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
    mockUseAuth.mockReturnValue({
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
    mockUseAuth.mockReturnValue({
      user: {
        token: "123",
        permissions: ["user.read"]
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