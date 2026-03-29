import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Noticias from "../../src/Pages/Public/Noticias";

// 🔹 Mock del hook principal
vi.mock("../../Components/Hooks/useFetchList", () => ({
  useFetchList: vi.fn()
}));

// 🔹 Mocks de componentes
vi.mock("../../Components/Common/Breadcrumb", () => ({
  default: () => <div>Breadcrumb</div>
}));

vi.mock("../../Components/Common/SearchBarAdvanced", () => ({
  default: ({ value, onChange }) => (
    <input
      data-testid="search"
      value={value}
      onChange={onChange}
    />
  )
}));

vi.mock("../../Components/Common/Pagination", () => ({
  default: ({ onPageChange }) => (
    <button onClick={() => onPageChange(2)}>Página 2</button>
  )
}));

vi.mock("../../Components/Common/AccordionFilter", () => ({
  default: ({ onChange, onClear }) => (
    <div>
      <button onClick={() => onChange("category", ["Política"])}>
        Filtrar
      </button>
      <button onClick={onClear}>Limpiar</button>
    </div>
  )
}));

vi.mock("../../Components/Cards/NoticiasCard", () => ({
  default: ({ news }) => <div>{news.title}</div>
}));

import { useFetchList } from "../../Components/Hooks/useFetchList";

describe("Noticias", () => {

  it("renderiza loading", () => {
    useFetchList.mockReturnValue({
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
    expect(screen.getByText(/cargando noticias/i)).toBeInTheDocument();
  });

  it("renderiza noticias correctamente", () => {
    useFetchList.mockReturnValue({
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
    useFetchList.mockReturnValue({
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
    const setSearch = vi.fn();

    useFetchList.mockReturnValue({
      search: "",
      setSearch,
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

    expect(setSearch).toHaveBeenCalled();
  });

  it("aplica filtros", () => {
    const setFilters = vi.fn();

    useFetchList.mockReturnValue({
      search: "",
      setSearch: vi.fn(),
      filters: {},
      setFilters,
      page: 1,
      setPage: vi.fn(),
      data: [],
      totalPages: 1,
      totalResults: 0,
      loading: false
    });

    render(<Noticias />);

    fireEvent.click(screen.getByText("Filtrar"));

    expect(setFilters).toHaveBeenCalled();
  });

  it("limpia filtros y búsqueda", () => {
    const setFilters = vi.fn();
    const setSearch = vi.fn();

    useFetchList.mockReturnValue({
      search: "test",
      setSearch,
      filters: { category: ["Política"] },
      setFilters,
      page: 1,
      setPage: vi.fn(),
      data: [],
      totalPages: 1,
      totalResults: 0,
      loading: false
    });

    render(<Noticias />);

    fireEvent.click(screen.getByText("Limpiar"));

    expect(setFilters).toHaveBeenCalledWith({});
    expect(setSearch).toHaveBeenCalledWith("");
  });

  it("cambia de página", () => {
    const setPage = vi.fn();

    useFetchList.mockReturnValue({
      search: "",
      setSearch: vi.fn(),
      filters: {},
      setFilters: vi.fn(),
      page: 1,
      setPage,
      data: [],
      totalPages: 2,
      totalResults: 10,
      loading: false
    });

    render(<Noticias />);

    fireEvent.click(screen.getByText("Página 2"));

    expect(setPage).toHaveBeenCalledWith(2);
  });

});