import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import MainLayout from "../../src/Layouts/MainLayout";
import { MemoryRouter } from "react-router-dom";

// 🔥 ESCUDO 1: Mockeamos el AuthContext por si Vitest carga el Navbar real
vi.mock("../../src/Context/AuthContext", () => ({
  useAuth: () => ({
    user: { token: "fake-token", name: "Usuario Test" },
    logout: vi.fn()
  })
}));

// 🔥 ESCUDO 2: Mocks visuales usando <div> para no chocar con las etiquetas semánticas de tu Layout
vi.mock("../../src/Components/Navbar/Navbar", () => ({
  default: () => <div data-testid="navbar">Navbar</div>,
}));

vi.mock("../../src/Components/Footer/Footer", () => ({
  default: () => <div data-testid="footer">Footer</div>,
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    Outlet: () => <div data-testid="outlet">Outlet</div>,
  };
});

describe("MainLayout", () => {

  it("renderiza Navbar, Outlet y Footer", () => {
    // Envolvemos el layout en MemoryRouter para evitar crashes de navegación interna
    render(
      <MemoryRouter>
        <MainLayout />
      </MemoryRouter>
    );

    // Usamos los test-ids que inyectamos en nuestros mocks. Infalible.
    expect(screen.getByTestId("navbar")).toBeInTheDocument();
    expect(screen.getByTestId("outlet")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();
  });

});