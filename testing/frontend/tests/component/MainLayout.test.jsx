// MainLayout.test.jsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import MainLayout from "../../src/Layouts/MainLayout";

// 🔥 mocks
vi.mock("../Components/Navbar/Navbar", () => ({
  default: () => <div data-testid="navbar">Navbar</div>,
}));

vi.mock("../Components/Footer/Footer", () => ({
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
    render(<MainLayout />);

    expect(screen.getByTestId("navbar")).toBeInTheDocument();
    expect(screen.getByTestId("outlet")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();
  });

});