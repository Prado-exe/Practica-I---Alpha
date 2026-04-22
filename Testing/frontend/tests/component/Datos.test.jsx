import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import Datos from "../../src/Pages/Public/Datos";
import { MemoryRouter } from "react-router-dom";

/* =========================
   MOCKS DE COMPONENTES
========================= */

// 👇 Mock de los servicios que causan el ECONNRESET
vi.mock("../../src/Services/EtiquetaService", () => ({
  getTags: vi.fn().mockResolvedValue({ data: [{ id: 1, name: "Tag Test" }] }),
  getLicencias: vi.fn().mockResolvedValue({ data: [{ id: 1, name: "MIT" }] })
}));

vi.mock("../../src/Services/CategoriaService", () => ({
  getCategorias: vi.fn().mockResolvedValue({ data: [{ id: 1, name: "Salud" }] })
}));

vi.mock("../../src/Components/Common/Breadcrumb", () => ({
  default: ({ paths = [] }) => <div>Breadcrumb: {paths.join(" > ")}</div>
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

vi.mock("../../src/Components/Common/AccordionFilter", () => ({
  default: ({ onChange }) => (
    <button onClick={() => onChange("categoria", ["Salud"])}>
      Aplicar filtro
    </button>
  )
}));

vi.mock("../../src/Components/Common/Pagination", () => ({
  default: ({ onPageChange }) => (
    <button onClick={() => onPageChange(2)}>Cambiar página</button>
  )
}));

vi.mock("../../src/Components/Cards/DatasetCard", () => ({
  default: ({ dataset }) => (
    <div data-testid="dataset">{dataset.title || dataset.titulo}</div>
  )
}));

/* =========================
   MOCK DEL HOOK (Ruta corregida)
========================= */

// ✅ Probamos la ruta que tenías antes pero asegurando el src/
// Si esto falla, verifica si la carpeta 'hooks' es con minúscula
vi.mock("../../src/Components/Hooks/useFetchList", () => ({
  useFetchList: vi.fn()
}));

import { useFetchList } from "../../src/Components/Hooks/useFetchList";

/* =========================
   TESTS
========================= */

describe("Datos Page", () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => render(
    <MemoryRouter>
      <Datos />
    </MemoryRouter>
  );

 it("muestra loading", () => {
    vi.mocked(useFetchList).mockReturnValue({
      search: "",
      setSearch: vi.fn(),
      filters: {},
      setFilters: vi.fn(),
      page: 1,
      setPage: vi.fn(),
      data: [],
      totalPages: 1,
      totalResults: 0,
      loading: true // Esto dispara el div class="loading-state"
    });

    renderComponent();
    // ✅ CORRECCIÓN: Texto específico para evitar duplicidad con "Cargando filtros"
    expect(screen.getByText(/Cargando datasets/i)).toBeInTheDocument();
  });

  it("muestra empty state", () => {
    vi.mocked(useFetchList).mockReturnValue({
      search: "",
      setSearch: vi.fn(),
      filters: {},
      setFilters: vi.fn(),
      page: 1,
      setPage: vi.fn(),
      data: [],
      totalPages: 1,
      totalResults: 0,
      loading: false
    });

    renderComponent();
    expect(screen.getByText(/No se encontraron resultados/i)).toBeInTheDocument();
  });

  it("muestra datasets", () => {
    vi.mocked(useFetchList).mockReturnValue({
      search: "",
      setSearch: vi.fn(),
      filters: {},
      setFilters: vi.fn(),
      page: 1,
      setPage: vi.fn(),
      data: [
        { id: 1, title: "Dataset 1" },
        { id: 2, title: "Dataset 2" }
      ],
      totalPages: 1,
      totalResults: 2,
      loading: false
    });

    renderComponent();
    expect(screen.getByText("Dataset 1")).toBeInTheDocument();
    expect(screen.getByText("Dataset 2")).toBeInTheDocument();
  });

  it("muestra total de resultados", () => {
    vi.mocked(useFetchList).mockReturnValue({
      search: "",
      setSearch: vi.fn(),
      filters: {},
      setFilters: vi.fn(),
      page: 1,
      setPage: vi.fn(),
      data: [{ id: 1, title: "Dataset 1" }],
      totalPages: 1,
      totalResults: 99,
      loading: false
    });

    renderComponent();
    expect(screen.getByText(/99 resultados/i)).toBeInTheDocument();
  });

  it("permite escribir en el buscador", () => {
    const setSearchMock = vi.fn();

    vi.mocked(useFetchList).mockReturnValue({
      search: "",
      setSearch: setSearchMock,
      filters: {},
      setFilters: vi.fn(),
      page: 1,
      setPage: vi.fn(),
      data: [],
      totalPages: 1,
      totalResults: 0,
      loading: false
    });

    renderComponent();

    const input = screen.getByTestId("search");
    fireEvent.change(input, { target: { value: "test" } });

    expect(setSearchMock).toHaveBeenCalled();
  });

  it("aplica filtros", async () => {
    const setFiltersMock = vi.fn();

    vi.mocked(useFetchList).mockReturnValue({
      search: "",
      setSearch: vi.fn(),
      filters: {},
      setFilters: setFiltersMock,
      page: 1,
      setPage: vi.fn(),
      data: [],
      totalPages: 1,
      totalResults: 0,
      loading: false 
    });

    renderComponent();
    
    // ✅ CORRECCIÓN FINAL: Usamos findByText (con await) para darle tiempo 
    // al componente de resolver los mocks de los servicios y mostrar el botón.
    const btnFiltro = await screen.findByText(/Aplicar filtro/i);
    fireEvent.click(btnFiltro);

    expect(setFiltersMock).toHaveBeenCalled();
  });

  it("cambia de página", () => {
    const setPageMock = vi.fn();

    vi.mocked(useFetchList).mockReturnValue({
      search: "",
      setSearch: vi.fn(),
      filters: {},
      setFilters: vi.fn(),
      page: 1,
      setPage: setPageMock,
      data: [{ id: 1, title: "Dataset 1" }],
      totalPages: 3,
      totalResults: 1,
      loading: false
    });

    renderComponent();
    fireEvent.click(screen.getByText(/Cambiar página/i));
    expect(setPageMock).toHaveBeenCalledWith(2);
  });

});