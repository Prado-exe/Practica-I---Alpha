// AdminLayout.test.jsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AdminLayout from "../../src/Layouts/AdminLayout";

// 🔥 mocks de componentes
vi.mock("../Components/Admin/Sidebar", () => ({
  default: () => <div data-testid="sidebar">Sidebar</div>,
}));

vi.mock("../Components/Common/Breadcrumb", () => ({
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

  it("bloquea acceso en mobile", () => {
    // simular pantalla pequeña
    window.innerWidth = 500;

    render(<AdminLayout />);

    expect(
      screen.getByText("Panel no disponible en dispositivos móviles")
    ).toBeInTheDocument();
  });

  it("renderiza layout en desktop", () => {
    window.innerWidth = 1200;

    render(<AdminLayout />);

    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("breadcrumb")).toBeInTheDocument();
    expect(screen.getByTestId("outlet")).toBeInTheDocument();
  });

  it("cambia dinámicamente al hacer resize", () => {
    window.innerWidth = 1200;

    render(<AdminLayout />);

    expect(screen.getByTestId("sidebar")).toBeInTheDocument();

    // 🔥 simular resize a mobile
    window.innerWidth = 500;
    window.dispatchEvent(new Event("resize"));

    expect(
      screen.getByText("Panel no disponible en dispositivos móviles")
    ).toBeInTheDocument();
  });

});