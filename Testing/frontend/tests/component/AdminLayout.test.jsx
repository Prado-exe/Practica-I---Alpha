import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AdminLayout from "../../src/Layouts/AdminLayout";
import { MemoryRouter } from "react-router-dom";

// 🔥 Mocks de componentes con la ruta correcta
vi.mock("../../src/Components/Admin/Sidebar", () => ({
  default: () => <div data-testid="sidebar">Sidebar</div>,
}));

vi.mock("../../src/Components/Common/Breadcrumb", () => ({
  default: () => <div data-testid="breadcrumb">Breadcrumb</div>,
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    Outlet: () => <div data-testid="outlet">Outlet</div>,
  };
});

describe("AdminLayout", () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <AdminLayout />
      </MemoryRouter>
    );
  };

  it("bloquea acceso en mobile", () => {
    // simular pantalla pequeña
    window.innerWidth = 500;
    window.dispatchEvent(new Event("resize"));

    renderComponent();

    expect(
      screen.getByText(/Panel no disponible en dispositivos móviles/i)
    ).toBeInTheDocument();
  });

  it("renderiza layout en desktop", () => {
    window.innerWidth = 1200;
    window.dispatchEvent(new Event("resize"));

    renderComponent();

    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("breadcrumb")).toBeInTheDocument();
    expect(screen.getByTestId("outlet")).toBeInTheDocument();
  });

  // ✅ Añadimos "async" al test
  it("cambia dinámicamente al hacer resize", async () => {
    window.innerWidth = 1200;
    window.dispatchEvent(new Event("resize"));

    renderComponent();

    expect(screen.getByTestId("sidebar")).toBeInTheDocument();

    // 🔥 simular resize a mobile
    window.innerWidth = 500;
    window.dispatchEvent(new Event("resize"));

    // ✅ Usamos waitFor para esperar a que React actualice el DOM tras el resize
    await waitFor(() => {
      expect(
        screen.getByText(/Panel no disponible en dispositivos móviles/i)
      ).toBeInTheDocument();
    });
  });

});