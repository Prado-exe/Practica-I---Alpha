import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import Noticias from "../../src/Pages/Public/Noticias";

/* =========================
   MOCKS DE COMPONENTES
========================= */

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
      <button onClick={() => onChange("category", ["Política"])}>
        Filtrar
      </button>
      <button onClick={onClear}>Limpiar</button>
    </div>
  )
}));

vi.mock("../../src/Components/Cards/NoticiasCard", () => ({
  default: ({ news }) => <div>{news.title}</div>
}));

/* =========================
   MOCK DEL HOOK (Ruta Corregida)
========================= */

// ✅ Cambiamos la ruta a la ubicación real: src/Components/Hooks/
vi.mock("../../src/Components/Hooks/useFetchList", () => ({
  useFetchList: vi.fn()
}));

import { useFetchList } from "../../src/Components/Hooks/useFetchList";

/* =========================
   TESTS
========================= */

describe("Noticias", () => {

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

    render(<Noticias />);
    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
  });

  it("renderiza noticias correctamente", () => {
    vi.mocked(useFetchList).mockReturnValue({
      search: "",
      setSearch: vi.fn(),
      filters: {},
      setFilters: vi.fn(),
      page: 1,
      setPage: vi.fn(),
      data: [
        { id: 1, title: "Noticia 1" },
        { id: 2, title: "Noticia 2" }
      ],
      totalPages: 1,
      totalResults: 2,
      loading: false
    });

    render(<Noticias />);

    expect(screen.getByText("Noticia 1")).toBeInTheDocument();
    expect(screen.getByText("Noticia 2")).toBeInTheDocument();
  });

  it("muestra mensaje cuando no hay noticias", () => {
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

    render(<Noticias />);
    expect(screen.getByText(/no se encontraron noticias/i)).toBeInTheDocument();
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

    render(<Noticias />);

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

    render(<Noticias />);

    fireEvent.click(screen.getByText("Filtrar"));

    expect(setFiltersMock).toHaveBeenCalled();
  });

  it("limpia filtros y búsqueda", () => {
    const setFiltersMock = vi.fn();
    const setSearchMock = vi.fn();

    vi.mocked(useFetchList).mockReturnValue({
      search: "test",
      setSearch: setSearchMock,
      filters: { category: ["Política"] },
      setFilters: setFiltersMock,
      page: 1,
      setPage: vi.fn(),
      data: [],
      totalPages: 1,
      totalResults: 0,
      loading: false
    });

    render(<Noticias />);

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

    render(<Noticias />);

    fireEvent.click(screen.getByText("Página 2"));

    expect(setPageMock).toHaveBeenCalledWith(2);
  });

});