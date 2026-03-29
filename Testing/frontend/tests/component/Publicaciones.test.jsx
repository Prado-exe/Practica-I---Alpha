import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Publicaciones from "../../src/Pages/Public/Publicaciones";

// 🔹 Mock hook
vi.mock("../../Components/Hooks/useFetchList", () => ({
  useFetchList: vi.fn()
}));

// 🔹 Mock componentes
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
      <button onClick={() => onChange("type", ["Artículo"])}>
        Filtrar
      </button>
      <button onClick={onClear}>Limpiar</button>
    </div>
  )
}));

vi.mock("../../Components/Cards/PublicationCard", () => ({
  default: ({ publication }) => <div>{publication.title}</div>
}));

import { useFetchList } from "../../Components/Hooks/useFetchList";

describe("Publicaciones", () => {

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

    render(<Publicaciones />);
    expect(screen.getByText(/cargando publicaciones/i)).toBeInTheDocument();
  });

  it("renderiza publicaciones correctamente", () => {
    useFetchList.mockReturnValue({
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

    render(<Publicaciones />);
    expect(screen.getByText(/no se encontraron publicaciones/i)).toBeInTheDocument();
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

    render(<Publicaciones />);

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

    render(<Publicaciones />);

    fireEvent.click(screen.getByText("Filtrar"));

    expect(setFilters).toHaveBeenCalled();
  });

  it("limpia filtros y búsqueda", () => {
    const setFilters = vi.fn();
    const setSearch = vi.fn();

    useFetchList.mockReturnValue({
      search: "test",
      setSearch,
      filters: { type: ["Artículo"] },
      setFilters,
      page: 1,
      setPage: vi.fn(),
      data: [],
      totalPages: 1,
      totalResults: 0,
      loading: false
    });

    render(<Publicaciones />);

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

    render(<Publicaciones />);

    fireEvent.click(screen.getByText("Página 2"));

    expect(setPage).toHaveBeenCalledWith(2);
  });

  it("muestra contador correctamente", () => {
    useFetchList.mockReturnValue({
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

    expect(screen.getByText(/mostrando/i)).toBeInTheDocument();
    expect(screen.getByText(/de 10 publicaciones/i)).toBeInTheDocument();
  });

});