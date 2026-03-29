import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import GestionDatasets from "../../src/Pages/Admin/GestionDatasets";

/* =========================
   MOCKS
========================= */

// Auth
vi.mock("../../Context/AuthContext", () => ({
  useAuth: () => ({
    user: { token: "fake-token" },
  }),
}));

// Router
vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

// CanView (deja pasar todo)
vi.mock("../../Components/Common/CanView", () => ({
  default: ({ children }) => <>{children}</>,
}));

// Componentes hijos (evitamos render complejo)
vi.mock("./CrearDataset", () => ({
  default: ({ onCancel }) => (
    <div>
      <h1>CrearDataset Mock</h1>
      <button onClick={onCancel}>Volver</button>
    </div>
  ),
}));

vi.mock("./EditarDataset", () => ({
  default: ({ onCancel }) => (
    <div>
      <h1>EditarDataset Mock</h1>
      <button onClick={onCancel}>Volver</button>
    </div>
  ),
}));

// fetch
global.fetch = vi.fn();

/* =========================
   DATA MOCK
========================= */

const datasetsMock = [
  {
    dataset_id: 1,
    title: "Dataset 1",
    category_id: 1,
    institution_id: 1,
    dataset_status: "draft",
    creation_date: "2024-01-01",
  },
];

const categoriasMock = [
  { category_id: 1, name: "Salud" },
];

const institucionesMock = [
  { institution_id: 1, legal_name: "Gobierno" },
];

/* =========================
   HELPERS
========================= */

const mockFetchAll = () => {
  fetch.mockImplementation((url) => {
    if (url.includes("/datasets")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ data: datasetsMock }),
      });
    }

    if (url.includes("/categories")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ data: categoriasMock }),
      });
    }

    if (url.includes("/instituciones")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ instituciones: institucionesMock }),
      });
    }

    return Promise.resolve({ ok: true, json: async () => ({}) });
  });
};

/* =========================
   TESTS
========================= */

describe("GestionDatasets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchAll();
  });

  it("renderiza el header correctamente", async () => {
    render(<GestionDatasets />);

    expect(
      await screen.findByText("Gestión de Conjuntos de Datos")
    ).toBeInTheDocument();
  });

  it("carga datasets y los muestra en la tabla", async () => {
    render(<GestionDatasets />);

    expect(await screen.findByText("Dataset 1")).toBeInTheDocument();
    expect(screen.getByText("Salud")).toBeInTheDocument();
    expect(screen.getByText("Gobierno")).toBeInTheDocument();
  });

  it("muestra mensaje cuando no hay datasets", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    });

    render(<GestionDatasets />);

    expect(
      await screen.findByText("No se encontraron datasets registrados.")
    ).toBeInTheDocument();
  });

  it("permite escribir en filtros", async () => {
    render(<GestionDatasets />);

    const input = await screen.findByPlaceholderText(
      "Buscar por el nombre del dataset"
    );

    fireEvent.change(input, { target: { value: "test" } });

    expect(input.value).toBe("test");
  });

  it("limpia los filtros", async () => {
    render(<GestionDatasets />);

    const input = await screen.findByPlaceholderText(
      "Buscar por el nombre del dataset"
    );

    fireEvent.change(input, { target: { value: "test" } });

    fireEvent.click(screen.getByText("LIMPIAR"));

    expect(input.value).toBe("");
  });

  it("cambia a vista CrearDataset", async () => {
    render(<GestionDatasets />);

    const btn = await screen.findByText("Agregar Dataset");
    fireEvent.click(btn);

    expect(await screen.findByText("CrearDataset Mock")).toBeInTheDocument();
  });

  it("vuelve desde CrearDataset", async () => {
    render(<GestionDatasets />);

    fireEvent.click(await screen.findByText("Agregar Dataset"));

    fireEvent.click(await screen.findByText("Volver"));

    expect(
      await screen.findByText("Gestión de Conjuntos de Datos")
    ).toBeInTheDocument();
  });

  it("cambia a vista EditarDataset", async () => {
    render(<GestionDatasets />);

    const editBtn = await screen.findByTitle("Editar");
    fireEvent.click(editBtn);

    expect(await screen.findByText("EditarDataset Mock")).toBeInTheDocument();
  });

  it("elimina dataset correctamente", async () => {
    window.confirm = vi.fn(() => true);
    window.alert = vi.fn();

    // mock delete
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    render(<GestionDatasets />);

    const deleteBtn = await screen.findByTitle("Eliminar");
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/datasets/1"),
        expect.objectContaining({
          method: "DELETE",
        })
      );

      expect(window.alert).toHaveBeenCalled();
    });
  });

  it("no elimina si usuario cancela confirmación", async () => {
    window.confirm = vi.fn(() => false);

    render(<GestionDatasets />);

    const deleteBtn = await screen.findByTitle("Eliminar");
    fireEvent.click(deleteBtn);

    expect(fetch).not.toHaveBeenCalledWith(
      expect.stringContaining("/api/datasets/1"),
      expect.objectContaining({ method: "DELETE" })
    );
  });
});