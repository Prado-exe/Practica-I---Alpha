import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CrearDataset from "../../src/Pages/Admin/CrearDataset";
import { MemoryRouter } from "react-router-dom";

/* =========================
   MOCKS
========================= */

// Mock Auth
vi.mock("../../src/Context/AuthContext", () => ({
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

const renderComponent = (props) => {
  return render(
    <MemoryRouter>
      <CrearDataset {...props} />
    </MemoryRouter>
  );
};

/* =========================
   TESTS
========================= */

describe("CrearDataset", () => {
  const onCancelMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchInitialData();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  it("renderiza el paso 1 correctamente", async () => {
    renderComponent({ onCancel: onCancelMock });

    expect(await screen.findByText(/Crear Nuevo Dataset/i)).toBeInTheDocument();
    expect(screen.getByText(/Paso 1 de 2/i)).toBeInTheDocument();
  });

  it("carga categorías, licencias e instituciones", async () => {
    renderComponent({ onCancel: onCancelMock });

    await waitFor(() => {
      expect(screen.getByText("Salud")).toBeInTheDocument();
      expect(screen.getByText("MIT")).toBeInTheDocument();
      expect(screen.getByText("Gobierno")).toBeInTheDocument();
    });
  });

  it("permite avanzar al paso 2", async () => {
    const { container } = renderComponent({ onCancel: onCancelMock });

    // Esperamos que los campos se rendericen
    await waitFor(() => {
      expect(container.querySelector('[name="title"]')).toBeInTheDocument();
    });

    fireEvent.change(container.querySelector('[name="title"]'), {
      target: { value: "Dataset prueba" },
    });

    fireEvent.change(container.querySelector('[name="summary"]'), {
      target: { value: "Resumen" },
    });

    fireEvent.change(container.querySelector('[name="description"]'), {
      target: { value: "Descripción larga" },
    });

    fireEvent.change(container.querySelector('[name="category_id"]'), {
      target: { value: "1" },
    });

    fireEvent.change(container.querySelector('[name="license_id"]'), {
      target: { value: "1" },
    });

    const btnContinuar = screen.getByRole("button", { name: /Continuar/i });
    fireEvent.click(btnContinuar);

    // ✅ CORRECCIÓN: Buscamos un texto que SÍ exista en el paso 2 de tu componente
    expect(await screen.findByText(/Subida de archivos/i)).toBeInTheDocument();
  });

  it("permite seleccionar archivos", async () => {
    const { container } = renderComponent({ onCancel: onCancelMock });

    const form = container.querySelector("form");
    fireEvent.submit(form);

    const file = new File(["contenido"], "test.csv", {
      type: "text/csv",
    });

    const input = await screen.findByLabelText(/seleccionar archivos/i);

    fireEvent.change(input, {
      target: { files: [file] },
    });

    expect(await screen.findByText(/test.csv/i)).toBeInTheDocument();
  });

  it("elimina archivos correctamente", async () => {
    const { container } = renderComponent({ onCancel: onCancelMock });

    const form = container.querySelector("form");
    fireEvent.submit(form);

    const file = new File(["contenido"], "test.csv", {
      type: "text/csv",
    });

    const input = await screen.findByLabelText(/seleccionar archivos/i);

    fireEvent.change(input, {
      target: { files: [file] },
    });

    const removeBtn = await screen.findByText("✖");
    fireEvent.click(removeBtn);

    expect(screen.queryByText(/test.csv/)).not.toBeInTheDocument();
  });

  it("llama a onCancel al presionar volver", async () => {
    renderComponent({ onCancel: onCancelMock });

    const btn = await screen.findByRole("button", { name: /Volver|Cancelar/i });
    fireEvent.click(btn);

    expect(onCancelMock).toHaveBeenCalled();
  });

  it("no permite enviar sin archivos", async () => {
    const { container } = renderComponent({ onCancel: onCancelMock });

    const form = container.querySelector("form");
    fireEvent.submit(form); 

    const submitBtn = await screen.findByRole("button", { name: /Publicar Dataset/i });
    
    expect(submitBtn).toBeDisabled();
  });
});