import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Datos from "../../src/Pages/Public/Datos";

// 🔹 MOCK COMPONENTES HIJOS
vi.mock("../../Components/Common/Breadcrumb", () => ({
  default: ({ paths }) => <div>Breadcrumb: {paths.join(" > ")}</div>
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

vi.mock("../../Components/Common/AccordionFilter", () => ({
  default: ({ onChange }) => (
    <button onClick={() => onChange("categoria", ["Salud"])}>
      Aplicar filtro
    </button>
  )
}));

vi.mock("../../Components/Common/Pagination", () => ({
  default: ({ onPageChange }) => (
    <button onClick={() => onPageChange(2)}>Cambiar página</button>
  )
}));

vi.mock("../../Components/Cards/DatasetCard", () => ({
  default: ({ dataset }) => (
    <div data-testid="dataset">{dataset.title}</div>
  )
}));

// 🔹 MOCK HOOK PRINCIPAL
vi.mock("../../Components/Hooks/useFetchList", () => ({
  useFetchList: vi.fn()
}));

import { useFetchList } from "../../Components/Hooks/useFetchList";

describe("Datos Page", () => {

  it("muestra loading", () => {
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

    render(<Datos />);

    expect(screen.getByText("Cargando datasets...")).toBeInTheDocument();
  });

  it("muestra empty state", () => {
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

    render(<Datos />);

    expect(screen.getByText("No se encontraron resultados")).toBeInTheDocument();
  });

  it("muestra datasets", () => {
    useFetchList.mockReturnValue({
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

    render(<Datos />);

    expect(screen.getByText("Dataset 1")).toBeInTheDocument();
    expect(screen.getByText("Dataset 2")).toBeInTheDocument();
  });

  it("muestra total de resultados", () => {
    useFetchList.mockReturnValue({
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

    render(<Datos />);

    expect(screen.getByText("99 resultados")).toBeInTheDocument();
  });

  it("permite escribir en el buscador", () => {
    const setSearchMock = vi.fn();

    useFetchList.mockReturnValue({
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

    render(<Datos />);

    fireEvent.change(screen.getByTestId("search"), {
      target: { value: "test" }
    });

    expect(setSearchMock).toHaveBeenCalled();
  });

  it("aplica filtros", () => {
    const setFiltersMock = vi.fn();

    useFetchList.mockReturnValue({
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

    render(<Datos />);

    fireEvent.click(screen.getByText("Aplicar filtro"));

    expect(setFiltersMock).toHaveBeenCalled();
  });

  it("muestra chips de filtros activos", () => {
    useFetchList.mockReturnValue({
      search: "",
      setSearch: vi.fn(),
      filters: { categoria: ["Salud"] },
      setFilters: vi.fn(),
      page: 1,
      setPage: vi.fn(),
      data: [],
      totalPages: 1,
      totalResults: 0,
      loading: false
    });

    render(<Datos />);

    expect(screen.getByText("categoria: Salud ✕")).toBeInTheDocument();
  });

  it("cambia de página", () => {
    const setPageMock = vi.fn();

    useFetchList.mockReturnValue({
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

    render(<Datos />);

    fireEvent.click(screen.getByText("Cambiar página"));

    expect(setPageMock).toHaveBeenCalledWith(2);
  });

});