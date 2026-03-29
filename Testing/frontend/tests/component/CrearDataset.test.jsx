import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CrearDataset from "../../src/Pages/Admin/CrearDataset";

/* =========================
   MOCKS
========================= */

// Mock Auth
vi.mock("../../Context/AuthContext", () => ({
  useAuth: () => ({
    user: {
      token: "fake-token",
    },
  }),
}));

// Mock global fetch
global.fetch = vi.fn();

/* =========================
   HELPERS
========================= */

const mockFetchInitialData = () => {
  fetch.mockImplementation((url) => {
    if (url.includes("/categories")) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            data: [{ category_id: 1, name: "Salud" }],
          }),
      });
    }

    if (url.includes("/licenses")) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            data: [{ license_id: 1, name: "MIT" }],
          }),
      });
    }

    if (url.includes("/instituciones")) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            instituciones: [
              { institution_id: 1, legal_name: "Gobierno" },
            ],
          }),
      });
    }

    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  });
};

/* =========================
   TESTS
========================= */

describe("CrearDataset", () => {
  const onCancelMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchInitialData();
  });

  it("renderiza el paso 1 correctamente", async () => {
    render(<CrearDataset onCancel={onCancelMock} />);

    expect(await screen.findByText("Crear Nuevo Dataset")).toBeInTheDocument();
    expect(screen.getByText(/Paso 1 de 2/)).toBeInTheDocument();
  });

  it("carga categorías, licencias e instituciones", async () => {
    render(<CrearDataset onCancel={onCancelMock} />);

    await waitFor(() => {
      expect(screen.getByText("Salud")).toBeInTheDocument();
      expect(screen.getByText("MIT")).toBeInTheDocument();
      expect(screen.getByText("Gobierno")).toBeInTheDocument();
    });
  });

  it("permite avanzar al paso 2", async () => {
    render(<CrearDataset onCancel={onCancelMock} />);

    const tituloInput = await screen.findByLabelText("Título del Dataset *");

    fireEvent.change(tituloInput, {
      target: { value: "Dataset prueba" },
    });

    fireEvent.change(screen.getByLabelText("Resumen Corto (Máx 500 caract.) *"), {
      target: { value: "Resumen" },
    });

    fireEvent.change(screen.getByLabelText("Descripción Completa *"), {
      target: { value: "Descripción larga" },
    });

    fireEvent.change(screen.getByLabelText("Categoría *"), {
      target: { value: "1" },
    });

    fireEvent.change(screen.getByLabelText("Licencia *"), {
      target: { value: "1" },
    });

    fireEvent.click(screen.getByText("Continuar a Archivos →"));

    expect(await screen.findByText("Archivos a subir:")).toBeInTheDocument();
  });

  it("permite seleccionar archivos", async () => {
    render(<CrearDataset onCancel={onCancelMock} />);

    // avanzar a paso 2 rápido
    fireEvent.submit(screen.getByRole("form"));

    const file = new File(["contenido"], "test.csv", {
      type: "text/csv",
    });

    const input = screen.getByLabelText(/seleccionar archivos/i);

    fireEvent.change(input, {
      target: { files: [file] },
    });

    expect(await screen.findByText(/test.csv/)).toBeInTheDocument();
  });

  it("elimina archivos correctamente", async () => {
    render(<CrearDataset onCancel={onCancelMock} />);

    fireEvent.submit(screen.getByRole("form"));

    const file = new File(["contenido"], "test.csv", {
      type: "text/csv",
    });

    const input = screen.getByLabelText(/seleccionar archivos/i);

    fireEvent.change(input, {
      target: { files: [file] },
    });

    const removeBtn = await screen.findByText("✖");
    fireEvent.click(removeBtn);

    expect(screen.queryByText(/test.csv/)).not.toBeInTheDocument();
  });

  it("llama a onCancel al presionar volver", async () => {
    render(<CrearDataset onCancel={onCancelMock} />);

    const btn = await screen.findByText("← Volver");
    fireEvent.click(btn);

    expect(onCancelMock).toHaveBeenCalled();
  });

  it("no permite enviar sin archivos", async () => {
    window.alert = vi.fn();

    render(<CrearDataset onCancel={onCancelMock} />);

    fireEvent.submit(screen.getByRole("form")); // ir a paso 2

    const submitBtn = screen.getByText("Publicar Dataset");
    fireEvent.click(submitBtn);

    expect(window.alert).toHaveBeenCalled();
  });
});