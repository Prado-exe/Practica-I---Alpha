import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Nosotros from "../../src/Pages/Public/Nosotros";

// 🔹 Mock de data
vi.mock("../../data/NosotrosPage", () => ({
  nosotrosPages: [
    {
      id: "mision",
      title: "Misión",
      content: [
        { type: "text", value: "Nuestra misión es..." },
        { type: "image", value: "img.jpg", alt: "imagen test" },
        {
          type: "table",
          headers: ["Col1", "Col2"],
          rows: [["A", "B"], ["C", "D"]]
        }
      ]
    },
    {
      id: "vision",
      title: "Visión",
      content: "Contenido simple"
    }
  ]
}));

describe("Nosotros", () => {

  const renderWithRoute = (route = "/nosotros/mision") => {
    return render(
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/nosotros/:section" element={<Nosotros />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it("renderiza menú lateral", () => {
    renderWithRoute();

    expect(screen.getByText("Sobre Nosotros")).toBeInTheDocument();
    expect(screen.getByText("Misión")).toBeInTheDocument();
    expect(screen.getByText("Visión")).toBeInTheDocument();
  });

  it("marca la sección activa", () => {
    renderWithRoute("/nosotros/mision");

    const activeItem = screen.getByText("Misión").closest("li");
    expect(activeItem.classList.contains("active")).toBe(true);
  });

  it("renderiza contenido tipo texto", () => {
    renderWithRoute("/nosotros/mision");

    expect(screen.getByText("Nuestra misión es...")).toBeInTheDocument();
  });

  it("renderiza contenido tipo imagen", () => {
    renderWithRoute("/nosotros/mision");

    const img = screen.getByAltText("imagen test");
    expect(img).toBeInTheDocument();
    expect(img.getAttribute("src")).toBe("img.jpg");
  });

  it("renderiza contenido tipo tabla", () => {
    renderWithRoute("/nosotros/mision");

    expect(screen.getByText("Col1")).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("D")).toBeInTheDocument();
  });

  it("renderiza contenido simple (string)", () => {
    renderWithRoute("/nosotros/vision");

    expect(screen.getByText("Contenido simple")).toBeInTheDocument();
  });

  it("usa fallback si la sección no existe", () => {
    renderWithRoute("/nosotros/no-existe");

    // debería caer en la primera página (Misión)
    expect(screen.getByText("Misión")).toBeInTheDocument();
  });

});