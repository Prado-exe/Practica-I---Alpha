import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";

// 🔁 Reset mocks entre tests
beforeEach(() => {
  vi.resetModules();
});

// 👇 MOCK GLOBAL BASE (usuario válido)
vi.mock("../Context/AuthContext", () => ({
  useAuth: () => ({
    user: {
      token: "fake-token",
      permissions: [
        "user_management.read",
        "roles_permissions.read",
        "admin_general.manage",
        "data_management.read"
      ]
    },
    loading: false
  })
}));

// 👇 Layouts
vi.mock("../Layouts/AdminLayout", () => ({
  default: () => <div>AdminLayout</div>
}));

vi.mock("../Layouts/MainLayout", () => ({
  default: ({ children }) => <div>MainLayout {children}</div>
}));

// 👇 Loader
vi.mock("../Components/Common/Loader", () => ({
  default: () => <div>Loading...</div>
}));

// 👇 Session Manager
vi.mock("../Components/SessionExpiryManager", () => ({
  default: () => <div>SessionManager</div>
}));

// 👇 PÁGINAS PUBLIC
vi.mock("../Pages/Public/Home", () => ({
  default: () => <div>Home Page</div>
}));

vi.mock("../Pages/Public/Noticias", () => ({
  default: () => <div>Noticias Page</div>
}));

vi.mock("../Pages/Public/Instituciones", () => ({
  default: () => <div>Instituciones Page</div>
}));

// 👇 PÁGINAS ADMIN
vi.mock("../Pages/Admin/Dashboard", () => ({
  default: () => <div>Dashboard</div>
}));

vi.mock("../Pages/Admin/GestionUsuarios", () => ({
  default: () => <div>Usuarios Page</div>
}));

vi.mock("../Pages/Admin/GestionRoles", () => ({
  default: () => <div>Roles Page</div>
}));

vi.mock("../Pages/Admin/GestionInstituciones", () => ({
  default: () => <div>Instituciones Admin</div>
}));

vi.mock("../Pages/Admin/GestionDatasets", () => ({
  default: () => <div>Datasets Page</div>
}));

// 👇 AUTH PAGES
vi.mock("../Pages/Login", () => ({
  default: () => <div>Login Page</div>
}));

vi.mock("../Pages/Register", () => ({
  default: () => <div>Register Page</div>
}));

// 👇 404
vi.mock("../Pages/Public/Error404", () => ({
  default: () => <div>404 Page</div>
}));

// 👇 IMPORT DESPUÉS DE MOCKS
import AppRoutes from "../Routes/AppRoutes";

describe("AppRoutes - Routing completo", () => {

  // 🌐 PUBLIC ROUTES
  it("renderiza Home en /", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(await screen.findByText("Home Page")).toBeInTheDocument();
  });

  it("renderiza Noticias", async () => {
    render(
      <MemoryRouter initialEntries={["/noticias"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(await screen.findByText("Noticias Page")).toBeInTheDocument();
  });

  // 🔐 ADMIN ROUTES
  it("entra a dashboard si está autenticado", async () => {
    render(
      <MemoryRouter initialEntries={["/administracion"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(await screen.findByText("Dashboard")).toBeInTheDocument();
  });

  it("permite acceso a usuarios con permiso", async () => {
    render(
      <MemoryRouter initialEntries={["/administracion/usuarios"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(await screen.findByText("Usuarios Page")).toBeInTheDocument();
  });

  it("permite acceso a roles", async () => {
    render(
      <MemoryRouter initialEntries={["/administracion/roles"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(await screen.findByText("Roles Page")).toBeInTheDocument();
  });

  it("permite acceso a datasets", async () => {
    render(
      <MemoryRouter initialEntries={["/administracion/datasets"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(await screen.findByText("Datasets Page")).toBeInTheDocument();
  });

  // ⏳ LOADING
  it("muestra loader mientras carga lazy", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  // ❌ 404
  it("muestra 404 en ruta inexistente", async () => {
    render(
      <MemoryRouter initialEntries={["/no-existe"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(await screen.findByText("404 Page")).toBeInTheDocument();
  });

});