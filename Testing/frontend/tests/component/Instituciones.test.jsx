import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
// ✅ CORRECCIÓN 1: Importar jest-dom para los matchers
import "@testing-library/jest-dom/vitest";
import Instituciones from "../../src/Pages/Public/Instituciones";

// 🔹 Mocks de componentes hijos - ✅ CORRECCIÓN 2: Rutas con src/
vi.mock("../../src/Components/Common/Breadcrumb", () => ({
  default: () => <div>Breadcrumb</div>
}));

vi.mock("../../src/Components/Common/Pagination", () => ({
  default: ({ onPageChange }) => (
    <button onClick={() => onPageChange(2)}>Cambiar página</button>
  )
}));

vi.mock("../../src/Components/Common/SearchBarAdvanced", () => ({
  default: ({ value, onChange }) => (
    <input
      data-testid="search"
      value={value}
      onChange={onChange}
      placeholder="buscar"
    />
  )
}));

vi.mock("../../src/Components/Cards/InstitucionCard", () => ({
  default: ({ institucion, onOpenModal }) => (
    <div>
      <span>{institucion.legal_name}</span>
      <button onClick={() => onOpenModal(institucion)}>Ver</button>
    </div>
  )
}));

// 🔹 Mock del servicio - ✅ CORRECCIÓN 3: Ruta con src/
vi.mock("../../src/Services/InstitucionesService", () => ({
  getInstituciones: vi.fn()
}));

import { getInstituciones } from "../../src/Services/InstitucionesService";

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
    // Mockeamos una promesa pendiente para ver el estado de carga
    getInstituciones.mockReturnValue(new Promise(() => {}));

    renderComponent();

    expect(screen.getByText(/Cargando/i)).toBeInTheDocument();
  });

  it("muestra instituciones correctamente", async () => {
    vi.mocked(getInstituciones).mockResolvedValue({
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

    expect(screen.getByText(/1 encontradas/i)).toBeInTheDocument();
  });

  it("muestra mensaje si no hay resultados", async () => {
    vi.mocked(getInstituciones).mockResolvedValue({
      data: [],
      totalPages: 1,
      total: 0
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/No se encontraron instituciones/i)).toBeInTheDocument();
    });
  });

  it("permite buscar y reinicia página", async () => {
    vi.mocked(getInstituciones).mockResolvedValue({
      data: [],
      totalPages: 1,
      total: 0
    });

    renderComponent();

    const input = await screen.findByTestId("search");

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
    vi.mocked(getInstituciones).mockResolvedValue({
      data: [],
      totalPages: 2,
      total: 10
    });

    renderComponent();

    const btn = await screen.findByText("Cambiar página");
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
    vi.mocked(getInstituciones).mockResolvedValue({
      data: [
        {
          institution_id: 1,
          legal_name: "Inst Modal",
          logo_url: "logo.png",
          short_name: "IM",
          country_name: "Chile",
          institution_type: "Publica",
          data_role: "Proveedor",
          description: "Descripción de prueba"
        }
      ],
      totalPages: 1,
      total: 1
    });

    renderComponent();

    const verBtn = await screen.findByText("Ver");
    fireEvent.click(verBtn);

    // Verificamos que el modal muestre el contenido
    expect(await screen.findByText("Descripción de prueba")).toBeInTheDocument();

    // Intentamos cerrar (asumiendo que hay un botón X o cerrar)
    const cerrarBtn = screen.getByText(/✕|Cerrar/i);
    fireEvent.click(cerrarBtn);

    await waitFor(() => {
      expect(screen.queryByText("Descripción de prueba")).not.toBeInTheDocument();
    });
  });

});