import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
// ✅ CORRECCIÓN 1: Importar matchers para el DOM
import "@testing-library/jest-dom/vitest";
import Publicaciones from "../../src/Pages/Public/Publicaciones";

/* =========================
   MOCKS DE COMPONENTES
========================= */

// ✅ CORRECCIÓN 2: Rutas con src/
vi.mock("../../src/Components/Common/Breadcrumb", () => ({
  default: () => <div>Breadcrumb</div>
}));

vi.mock("../../src/Components/Common/SearchBarAdvanced", () => ({
  default: ({ value, onChange }) => (
    <input
      data-testid="search"
      value={value}
      onChange={onChange}
    />
  )
}));

vi.mock("../../src/Components/Common/Pagination", () => ({
  default: ({ onPageChange }) => (
    <button onClick={() => onPageChange(2)}>Página 2</button>
  )
}));

vi.mock("../../src/Components/Common/AccordionFilter", () => ({
  default: ({ onChange, onClear }) => (
    <div>
      <button onClick={() => onChange("type", ["Artículo"])}>
        Filtrar
      </button>
      <button onClick={onClear}>Limpiar</button>
    </div>
  )
}));

vi.mock("../../src/Components/Cards/PublicationCard", () => ({
  default: ({ publication }) => <div>{publication.title}</div>
}));

/* =========================
   MOCK DEL HOOK
========================= */

// ✅ CORRECCIÓN 3: Ruta corregida del Hook
vi.mock("../../src/Components/Hooks/useFetchList", () => ({
  useFetchList: vi.fn()
}));

import { useFetchList } from "../../src/Components/Hooks/useFetchList";

describe("Publicaciones", () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza loading", () => {
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
      loading: true
    });

    render(<Publicaciones />);
    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
  });

  it("renderiza publicaciones correctamente", () => {
    vi.mocked(useFetchList).mockReturnValue({
      search: "",
      setSearch: vi.fn(),
      filters: {},
      setFilters: vi.fn(),
      page: 1,
      setPage: vi.fn(),
      data: [
        { id: 1, title: "Publicación 1" },
        { id: 2, title: "Publicación 2" }
      ],
      totalPages: 1,
      totalResults: 2,
      loading: false
    });

    render(<Publicaciones />);

    expect(screen.getByText("Publicación 1")).toBeInTheDocument();
    expect(screen.getByText("Publicación 2")).toBeInTheDocument();
  });

  it("muestra mensaje cuando no hay publicaciones", () => {
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

    render(<Publicaciones />);
    expect(screen.getByText(/no se encontraron/i)).toBeInTheDocument();
  });

  it("permite buscar", () => {
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

    render(<Publicaciones />);

    fireEvent.change(screen.getByTestId("search"), {
      target: { value: "test" }
    });

    expect(setSearchMock).toHaveBeenCalled();
  });

  it("aplica filtros", () => {
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

    render(<Publicaciones />);

    fireEvent.click(screen.getByText("Filtrar"));

    expect(setFiltersMock).toHaveBeenCalled();
  });

  it("limpia filtros y búsqueda", () => {
    const setFiltersMock = vi.fn();
    const setSearchMock = vi.fn();

    vi.mocked(useFetchList).mockReturnValue({
      search: "test",
      setSearch: setSearchMock,
      filters: { type: ["Artículo"] },
      setFilters: setFiltersMock,
      page: 1,
      setPage: vi.fn(),
      data: [],
      totalPages: 1,
      totalResults: 0,
      loading: false
    });

    render(<Publicaciones />);

    fireEvent.click(screen.getByText("Limpiar"));

    expect(setFiltersMock).toHaveBeenCalledWith({});
    expect(setSearchMock).toHaveBeenCalledWith("");
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
      data: [],
      totalPages: 2,
      totalResults: 10,
      loading: false
    });

    render(<Publicaciones />);

    fireEvent.click(screen.getByText("Página 2"));

    expect(setPageMock).toHaveBeenCalledWith(2);
  });

  it("muestra contador correctamente", () => {
    vi.mocked(useFetchList).mockReturnValue({
      search: "",
      setSearch: vi.fn(),
      filters: {},
      setFilters: vi.fn(),
      page: 2,
      setPage: vi.fn(),
      data: [{ id: 1, title: "Test" }],
      totalPages: 3,
      totalResults: 10,
      loading: false
    });

    render(<Publicaciones />);

    // 1. Verificamos la palabra "Mostrando"
    expect(screen.getByText(/mostrando/i)).toBeInTheDocument();
    
    // 2. ✅ CORRECCIÓN DEFINITIVA: 
    // Usamos un Regex que ignore los saltos de línea y espacios extra.
    // Buscamos: un 8, opcionalmente espacios, un guion, opcionalmente espacios, un 10.
    expect(screen.getByText(/8\s*-\s*10/)).toBeInTheDocument();
    
    // 3. Verificamos que el total aparezca (el 10 final)
    // Usamos getAll porque hay varios "10" en el DOM
    const tens = screen.getAllByText(/10/);
    expect(tens.length).toBeGreaterThanOrEqual(1);
    
    // 4. Verificamos la palabra final
    expect(screen.getByText(/publicaciones/i)).toBeInTheDocument();
  });

});