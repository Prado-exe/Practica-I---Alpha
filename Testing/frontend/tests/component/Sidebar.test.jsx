import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Sidebar from "../../src/Components/Admin/Sidebar";
import { MemoryRouter } from "react-router-dom";

// 🔹 Mock useAuth
vi.mock("../../Context/AuthContext", () => ({
  useAuth: vi.fn()
}));

// 🔹 Mock CanView (controlamos permisos manualmente)
vi.mock("../Common/CanView", () => ({
  default: ({ children }) => <>{children}</>
}));

// 🔹 Mock useLocation
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useLocation: vi.fn()
  };
});

import { useAuth } from "../../Context/AuthContext";
import { useLocation } from "react-router-dom";

describe("Sidebar", () => {

  beforeEach(() => {
    useAuth.mockReturnValue({
      user: {
        full_name: "Juan Pérez",
        role: "super_admin",
        permissions: [
          "data_management.read",
          "catalog.write",
          "user_management.read",
          "roles_permissions.read",
          "admin_general.manage"
        ]
      },
      logout: vi.fn()
    });

    useLocation.mockReturnValue({
      pathname: "/administracion"
    });
  });

  it("renderiza nombre y rol del usuario", () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    expect(screen.getByText("Juan Pérez")).toBeInTheDocument();
    expect(screen.getByText(/super admin/i)).toBeInTheDocument();
  });

  it("renderiza menú completo", () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Datasets")).toBeInTheDocument();
    expect(screen.getByText("Usuarios")).toBeInTheDocument();
  });

  it("marca link activo correctamente", () => {
    useLocation.mockReturnValue({
      pathname: "/administracion/usuarios"
    });

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    const link = screen.getByText("Usuarios").closest("a");
    expect(link.className).toContain("active");
  });

  it("colapsa y expande sidebar", () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    const toggleBtn = screen.getByLabelText("Toggle sidebar");

    fireEvent.click(toggleBtn);

    // cuando está colapsado, el nombre NO debería estar visible
    expect(screen.queryByText("Juan Pérez")).not.toBeInTheDocument();
  });

  it("muestra inicial del usuario en avatar", () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    expect(screen.getByText("J")).toBeInTheDocument();
  });

  it("ejecuta logout al hacer click", () => {
    const logout = vi.fn();

    useAuth.mockReturnValue({
      user: {
        full_name: "Juan Pérez",
        role: "super_admin"
      },
      logout
    });

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Salir"));

    expect(logout).toHaveBeenCalled();
  });

});