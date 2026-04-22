import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import Error404 from "../../src/Pages/Public/Error404";

describe("Error404 Page", () => {

  it("renderiza el código 404", () => {
    render(
      <MemoryRouter>
        <Error404 />
      </MemoryRouter>
    );

    expect(screen.getByText("404")).toBeInTheDocument();
  });

  it("muestra el mensaje de página no encontrada", () => {
    render(
      <MemoryRouter>
        <Error404 />
      </MemoryRouter>
    );

    expect(screen.getByText("Página no encontrada")).toBeInTheDocument();
    expect(
      screen.getByText("La página que buscas no existe o fue movida.")
    ).toBeInTheDocument();
  });

  it("tiene un link para volver al inicio", () => {
    render(
      <MemoryRouter>
        <Error404 />
      </MemoryRouter>
    );

    const link = screen.getByRole("link", { name: /volver al inicio/i });

    expect(link).toBeInTheDocument();
    expect(link.getAttribute("href")).toBe("/");
  });

});