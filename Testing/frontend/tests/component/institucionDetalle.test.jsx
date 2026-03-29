import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import InstitucionDetalle from "../../src/Pages/Public/InstitucionDetalle";

// Mock AccordionFilter (no lo queremos testear aquí)
vi.mock("../../Components/Common/AccordionFilter", () => ({
  default: () => <div>AccordionFilter</div>
}));

describe("InstitucionDetalle", () => {

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const renderWithRouter = (id = "1") => {
    return render(
      <MemoryRouter initialEntries={[`/instituciones/${id}`]}>
        <Routes>
          <Route path="/instituciones/:id" element={<InstitucionDetalle />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it("muestra loading inicialmente", () => {
    global.fetch = vi.fn(() =>
      new Promise(() => {}) // nunca resuelve
    );

    renderWithRouter();

    expect(screen.getByText("Cargando...")).toBeInTheDocument();
  });

  it("renderiza datos de la institución correctamente", async () => {
    global.fetch = vi.fn((url) => {
      if (url.includes("/datasets")) {
        return Promise.resolve({
          json: () => Promise.resolve([
            { id: 1, nombre: "Dataset 1", descripcion: "Desc 1" }
          ])
        });
      }

      return Promise.resolve({
        json: () => Promise.resolve({
          nombre: "Institución Test",
          descripcion: "Descripción Test",
          logo: "logo.png"
        })
      });
    });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText("Institución Test")).toBeInTheDocument();
    });

    expect(screen.getByText("Descripción Test")).toBeInTheDocument();
    expect(screen.getByText("Dataset 1")).toBeInTheDocument();
    expect(screen.getByText("Desc 1")).toBeInTheDocument();
  });

  it("muestra mensaje si no hay datasets", async () => {
    global.fetch = vi.fn((url) => {
      if (url.includes("/datasets")) {
        return Promise.resolve({
          json: () => Promise.resolve([])
        });
      }

      return Promise.resolve({
        json: () => Promise.resolve({
          nombre: "Institución X",
          descripcion: "Desc",
          logo: "logo.png"
        })
      });
    });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText("Institución X")).toBeInTheDocument();
    });

    expect(screen.getByText("No hay datasets")).toBeInTheDocument();
  });

  it("llama a los endpoints correctos", async () => {
    const fetchMock = vi.fn((url) => {
      if (url.includes("/datasets")) {
        return Promise.resolve({
          json: () => Promise.resolve([])
        });
      }

      return Promise.resolve({
        json: () => Promise.resolve({
          nombre: "Test",
          descripcion: "Test",
          logo: "logo.png"
        })
      });
    });

    global.fetch = fetchMock;

    renderWithRouter("99");

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/instituciones/99");
    expect(fetchMock).toHaveBeenCalledWith("/api/instituciones/99/datasets");
  });

});