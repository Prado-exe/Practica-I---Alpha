import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import Instituciones from "../../src/Pages/Public/Instituciones";

// 🔹 Mocks de componentes hijos
vi.mock("../../Components/Common/Breadcrumb", () => ({
  default: () => <div>Breadcrumb</div>
}));

vi.mock("../../Components/Common/Pagination", () => ({
  default: ({ onPageChange }) => (
    <button onClick={() => onPageChange(2)}>Cambiar página</button>
  )
}));

vi.mock("../../Components/Common/SearchBarAdvanced", () => ({
  default: ({ value, onChange }) => (
    <input
      data-testid="search"
      value={value}
      onChange={onChange}
      placeholder="buscar"
    />
  )
}));

vi.mock("../../Components/Cards/InstitucionCard", () => ({
  default: ({ institucion, onOpenModal }) => (
    <div>
      <span>{institucion.legal_name}</span>
      <button onClick={() => onOpenModal(institucion)}>Ver</button>
    </div>
  )
}));

// 🔹 Mock del servicio
vi.mock("../../Services/InstitucionesService", () => ({
  getInstituciones: vi.fn()
}));

import { getInstituciones } from "../../Services/InstitucionesService";

describe("Instituciones", () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () =>
    render(
      <BrowserRouter>
        <Instituciones />
      </BrowserRouter>
    );

  it("renderiza loading inicialmente", async () => {
    getInstituciones.mockResolvedValue({
      data: [],
      totalPages: 1,
      total: 0
    });

    renderComponent();

    expect(screen.getByText("Cargando...")).toBeInTheDocument();
  });

  it("muestra instituciones correctamente", async () => {
    getInstituciones.mockResolvedValue({
      data: [
        {
          institution_id: 1,
          legal_name: "Institución Test"
        }
      ],
      totalPages: 1,
      total: 1
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Institución Test")).toBeInTheDocument();
    });

    expect(screen.getByText("1 encontradas")).toBeInTheDocument();
  });

  it("muestra mensaje si no hay resultados", async () => {
    getInstituciones.mockResolvedValue({
      data: [],
      totalPages: 1,
      total: 0
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("No se encontraron instituciones")).toBeInTheDocument();
    });
  });

  it("permite buscar y reinicia página", async () => {
    getInstituciones.mockResolvedValue({
      data: [],
      totalPages: 1,
      total: 0
    });

    renderComponent();

    const input = screen.getByTestId("search");

    fireEvent.change(input, {
      target: { value: "ministerio" }
    });

    await waitFor(() => {
      expect(getInstituciones).toHaveBeenCalledWith(
        expect.objectContaining({
          search: "ministerio",
          page: 1
        })
      );
    });
  });

  it("cambia de página", async () => {
    getInstituciones.mockResolvedValue({
      data: [],
      totalPages: 2,
      total: 10
    });

    renderComponent();

    await waitFor(() => {
      expect(getInstituciones).toHaveBeenCalled();
    });

    const btn = screen.getByText("Cambiar página");
    fireEvent.click(btn);

    await waitFor(() => {
      expect(getInstituciones).toHaveBeenLastCalledWith(
        expect.objectContaining({
          page: 2
        })
      );
    });
  });

  it("abre y cierra modal", async () => {
    getInstituciones.mockResolvedValue({
      data: [
        {
          institution_id: 1,
          legal_name: "Inst Modal",
          logo_url: "logo.png",
          short_name: "IM",
          country_name: "Chile",
          institution_type: "Publica",
          data_role: "Proveedor",
          description: "Descripción"
        }
      ],
      totalPages: 1,
      total: 1
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Inst Modal")).toBeInTheDocument();
    });

    // abrir modal
    fireEvent.click(screen.getByText("Ver"));

    expect(screen.getByText("Descripción")).toBeInTheDocument();

    // cerrar modal
    fireEvent.click(screen.getByText("✕"));

    expect(screen.queryByText("Descripción")).not.toBeInTheDocument();
  });

});