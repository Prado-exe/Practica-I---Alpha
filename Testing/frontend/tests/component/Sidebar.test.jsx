import { render, screen, fireEvent } from "@testing-library/react";
// ✅ 1. CORRECCIÓN: Importamos beforeEach
import { describe, it, expect, vi, beforeEach } from "vitest";
import Sidebar from "../../src/Components/Admin/Sidebar";
import { MemoryRouter } from "react-router-dom";

// 🔹 Mock useAuth (✅ 2. CORRECCIÓN: Ruta con src/)
vi.mock("../../src/Context/AuthContext", () => ({
  useAuth: vi.fn()
}));

// 🔹 Mock CanView (✅ 2. CORRECCIÓN: Ruta con src/Components/)
vi.mock("../../src/Components/Common/CanView", () => ({
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

// ✅ CORRECCIÓN: Rutas de los imports reales para usarlos en el test
import { useAuth } from "../../src/Context/AuthContext";
import { useLocation } from "react-router-dom";

describe("Sidebar", () => {

  beforeEach(() => {
    vi.clearAllMocks();

    // Usamos vi.mocked para tipado y asignación segura
    vi.mocked(useAuth).mockReturnValue({
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

    vi.mocked(useLocation).mockReturnValue({
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

    // Usa regex por si los textos tienen espacios o variaciones
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Datasets/i)).toBeInTheDocument();
    expect(screen.getByText(/Usuarios/i)).toBeInTheDocument();
  });

  it("marca link activo correctamente", () => {
    vi.mocked(useLocation).mockReturnValue({
      pathname: "/administracion/usuarios"
    });

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    const link = screen.getByText(/Usuarios/i).closest("a");
    expect(link.className).toContain("active");
  });

  it("colapsa y expande sidebar", () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    // Usamos regex para atrapar variaciones en el aria-label
    const toggleBtn = screen.getByLabelText(/Toggle sidebar/i);

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

    // Dependiendo de tu UI, "J" puede ser renderizado aislado en un span o div
    expect(screen.getByText("J")).toBeInTheDocument();
  });

  it("ejecuta logout al hacer click", () => {
    const logoutMock = vi.fn();

    vi.mocked(useAuth).mockReturnValue({
      user: {
        full_name: "Juan Pérez",
        role: "super_admin"
      },
      logout: logoutMock
    });

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText(/Salir/i));

    expect(logoutMock).toHaveBeenCalled();
  });

});