import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import EditarDataset from "../../src/Pages/Admin/EditarDataset";

/* =========================
   MOCKS
========================= */

// Mock Auth
vi.mock("../../Context/AuthContext", () => ({
  useAuth: () => ({
    user: { token: "fake-token" },
  }),
}));

// Mock fetch global
global.fetch = vi.fn();

/* =========================
   DATA MOCK
========================= */

const datasetMock = {
  dataset_id: 1,
  title: "Dataset Original",
  summary: "Resumen original",
  description: "Descripción original",
  category_id: 1,
  license_id: 1,
  institution_id: 1,
  access_level: "public",
  creation_date: "2024-01-01T00:00:00.000Z",
  geographic_coverage: "Chile",
};

/* =========================
   HELPERS
========================= */

const mockFetchOptions = () => {
  fetch.mockImplementation((url) => {
    if (url.includes("/categories")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          data: [{ category_id: 1, name: "Salud" }],
        }),
      });
    }

    if (url.includes("/licenses")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          data: [{ license_id: 1, name: "MIT" }],
        }),
      });
    }

    if (url.includes("/instituciones")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          instituciones: [{ institution_id: 1, legal_name: "Gobierno" }],
        }),
      });
    }

    return Promise.resolve({ ok: true, json: async () => ({}) });
  });
};

/* =========================
   TESTS
========================= */

describe("EditarDataset", () => {
  const onCancelMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchOptions();
  });

  it("muestra loading inicialmente", () => {
    render(<EditarDataset dataset={datasetMock} onCancel={onCancelMock} />);
    expect(screen.getByText("Cargando opciones...")).toBeInTheDocument();
  });

  it("precarga los datos del dataset", async () => {
    render(<EditarDataset dataset={datasetMock} onCancel={onCancelMock} />);

    const input = await screen.findByDisplayValue("Dataset Original");
    expect(input).toBeInTheDocument();

    expect(screen.getByDisplayValue("Resumen original")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Descripción original")).toBeInTheDocument();
  });

  it("carga opciones en selects", async () => {
    render(<EditarDataset dataset={datasetMock} onCancel={onCancelMock} />);

    await waitFor(() => {
      expect(screen.getByText("Salud")).toBeInTheDocument();
      expect(screen.getByText("MIT")).toBeInTheDocument();
      expect(screen.getByText("Gobierno")).toBeInTheDocument();
    });
  });

  it("permite modificar campos", async () => {
    render(<EditarDataset dataset={datasetMock} onCancel={onCancelMock} />);

    const titulo = await screen.findByDisplayValue("Dataset Original");

    fireEvent.change(titulo, {
      target: { value: "Nuevo título" },
    });

    expect(titulo.value).toBe("Nuevo título");
  });

  it("permite avanzar al paso 2", async () => {
    render(<EditarDataset dataset={datasetMock} onCancel={onCancelMock} />);

    const btn = await screen.findByText("Continuar a Archivos →");
    fireEvent.click(btn);

    expect(
      await screen.findByText(/Actualizar Archivos/i)
    ).toBeInTheDocument();
  });

  it("permite seleccionar archivos nuevos", async () => {
    render(<EditarDataset dataset={datasetMock} onCancel={onCancelMock} />);

    fireEvent.click(await screen.findByText("Continuar a Archivos →"));

    const file = new File(["data"], "nuevo.csv", {
      type: "text/csv",
    });

    const input = screen.getByLabelText(/seleccionar nuevos archivos/i);

    fireEvent.change(input, {
      target: { files: [file] },
    });

    expect(await screen.findByText(/nuevo.csv/)).toBeInTheDocument();
  });

  it("envía el formulario (PUT) correctamente", async () => {
    window.alert = vi.fn();

    // mock PUT final
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    render(<EditarDataset dataset={datasetMock} onCancel={onCancelMock} />);

    fireEvent.click(await screen.findByText("Continuar a Archivos →"));

    fireEvent.click(screen.getByText("Guardar Cambios"));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
      expect(onCancelMock).toHaveBeenCalled();
    });
  });

  it("llama a onCancel al hacer click en volver", async () => {
    render(<EditarDataset dataset={datasetMock} onCancel={onCancelMock} />);

    const btn = await screen.findByText("← Volver");
    fireEvent.click(btn);

    expect(onCancelMock).toHaveBeenCalled();
  });
});