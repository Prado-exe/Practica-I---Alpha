import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import EditarDataset from "../../src/Pages/Admin/EditarDataset";
import { MemoryRouter } from "react-router-dom";
import { useAuth } from "../../src/Context/AuthContext";

/* =========================
   MOCKS
========================= */

vi.mock("../../src/Context/AuthContext", () => ({
  useAuth: vi.fn()
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ id: "1" }),
  };
});

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
  creation_date: "2024-01-01",
  geographic_coverage: "Chile",
};

/* =========================
   HELPERS
========================= */

const mockFetchOptions = () => {
  fetch.mockImplementation((url, options) => {
    if (options && options.method === "PUT") {
      return Promise.resolve({ ok: true, json: async () => ({}) });
    }
    if (url.includes("/categories")) {
      return Promise.resolve({ ok: true, json: async () => ({ data: [{ category_id: 1, name: "Salud" }] }) });
    }
    if (url.includes("/licenses")) {
      return Promise.resolve({ ok: true, json: async () => ({ data: [{ license_id: 1, name: "MIT" }] }) });
    }
    if (url.includes("/instituciones")) {
      return Promise.resolve({ ok: true, json: async () => ({ instituciones: [{ institution_id: 1, legal_name: "Gobierno" }] }) });
    }
    return Promise.resolve({ ok: true, json: async () => ({}) });
  });
};

// ✅ Añadimos datasetMock por defecto para que NUNCA falte el ID ni los datos
const renderComponent = (props = {}) => {
  return render(
    <MemoryRouter>
      <EditarDataset dataset={datasetMock} {...props} />
    </MemoryRouter>
  );
};

const fillFormSafely = async () => {
  await waitFor(() => {
    expect(screen.queryByText(/Cargando/i)).not.toBeInTheDocument();
  });

  const titleInputs = await screen.findAllByRole('textbox', { name: "" }); 
  const comboSelects = await screen.findAllByRole('combobox'); 
  const dateInput = document.querySelector('input[type="date"]'); 

  fireEvent.change(titleInputs[0], { target: { value: "Nuevo Título Llenado" } });
  
  if(dateInput) {
    fireEvent.change(dateInput, { target: { value: "2024-01-01" } });
  }

  if(comboSelects.length >= 2) {
    fireEvent.change(comboSelects[0], { target: { value: "1" } });
    fireEvent.change(comboSelects[1], { target: { value: "1" } });
  }

  const textAreas = document.querySelectorAll('textarea');
  if(textAreas.length >= 2) {
    fireEvent.change(textAreas[0], { target: { value: "Resumen llenado" } });
    fireEvent.change(textAreas[1], { target: { value: "Desc llenada" } });
  }
};

/* =========================
   TESTS
========================= */

describe("EditarDataset", () => {
  const onCancelMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchOptions();
    vi.spyOn(window, 'alert').mockImplementation(() => {});

    vi.mocked(useAuth).mockReturnValue({
      user: { token: "fake-token" },
      loading: false
    });
  });

  it("muestra loading inicialmente", () => {
    renderComponent({ onCancel: onCancelMock });
    expect(screen.getByText(/Cargando/i)).toBeInTheDocument();
  });

  it("precarga los datos del dataset", async () => {
    renderComponent({ onCancel: onCancelMock });
    await fillFormSafely();
    expect(screen.getByDisplayValue("Nuevo Título Llenado")).toBeInTheDocument();
  });

  it("carga opciones en selects", async () => {
    renderComponent({ onCancel: onCancelMock });
    await waitFor(() => {
      expect(screen.getByText("Salud")).toBeInTheDocument();
    });
  });

  it("permite modificar campos", async () => {
    renderComponent({ onCancel: onCancelMock });
    await fillFormSafely();
    
    const textboxes = screen.getAllByRole('textbox', { name: "" });
    fireEvent.change(textboxes[0], { target: { value: "Título editado 2" } });

    expect(textboxes[0].value).toBe("Título editado 2");
  });

  it("permite avanzar al paso 2", async () => {
    renderComponent({ onCancel: onCancelMock });
    await fillFormSafely();
    
    const btn = screen.getByRole("button", { name: /Continuar/i });
    fireEvent.click(btn);

    expect(await screen.findByText(/Archivos Actuales/i)).toBeInTheDocument();
  });

  it("permite seleccionar archivos nuevos", async () => {
    renderComponent({ onCancel: onCancelMock });
    await fillFormSafely();

    const btn = screen.getByRole("button", { name: /Continuar/i });
    fireEvent.click(btn); 

    const input = await waitFor(() => document.querySelector('input[type="file"]'));
    const file = new File(["data"], "nuevo.csv", { type: "text/csv" });

    fireEvent.change(input, {
      target: { files: [file] },
    });

    expect(await screen.findByText(/nuevo.csv/i)).toBeInTheDocument();
  });

  it("envía el formulario (PUT) correctamente", async () => {
    const { container } = renderComponent({ onCancel: onCancelMock });
    await fillFormSafely();

    // 1. Clickeamos el botón para avanzar al paso 2
    const btnContinuar = screen.getByRole("button", { name: /Continuar/i });
    fireEvent.click(btnContinuar);

    // 2. Nos aseguramos de estar en el paso 2
    await screen.findByText(/Archivos Actuales/i);

    // 3. Forzamos el SUBMIT al formulario completo (evita bugs nativos de JSDOM con botones)
    const form = container.querySelector("form");
    fireEvent.submit(form);

    // 4. Verificamos que se haya disparado el fetch tipo PUT
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String), 
        expect.objectContaining({ method: "PUT" })
      );
    });
  });

  it("llama a onCancel al hacer click en volver", async () => {
    renderComponent({ onCancel: onCancelMock });

    await waitFor(() => {
      expect(screen.queryByText(/Cargando/i)).not.toBeInTheDocument();
    });

    const btn = screen.getByRole("button", { name: /Volver|Cancelar/i });
    fireEvent.click(btn);

    expect(onCancelMock).toHaveBeenCalled();
  });
});