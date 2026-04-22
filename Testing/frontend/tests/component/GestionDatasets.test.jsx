import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import GestionDatasets from "../../src/Pages/Admin/GestionDatasets";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/vitest";

/* =========================
   MOCKS
========================= */

vi.mock("../../src/Context/AuthContext", () => ({
  useAuth: () => ({
    user: { token: "fake-token" },
  }),
}));

vi.mock("../../src/Components/Common/CanView", () => ({
  default: ({ children }) => <>{children}</>,
}));

vi.mock("../../src/Pages/Admin/CrearDataset", () => ({
  default: ({ onCancel }) => (
    <div>
      <h1>CrearDataset Mock</h1>
      <button onClick={onCancel}>Volver</button>
    </div>
  ),
}));

vi.mock("../../src/Pages/Admin/EditarDataset", () => ({
  default: ({ onCancel }) => (
    <div>
      <h1>EditarDataset Mock</h1>
      <button onClick={onCancel}>Volver</button>
    </div>
  ),
}));

global.fetch = vi.fn();

/* =========================
   DATA MOCK (Corregido según estructura probable)
========================= */

const datasetsMock = [
  {
    dataset_id: 1,
    // ✅ Probamos con 'nombre' y 'title' para asegurar que se pinte en la celda
    nombre: "Dataset 1",
    title: "Dataset 1",
    dataset_status: "draft",
    fecha_creacion: "2024-01-01",
    creation_date: "2024-01-01",
  },
];

const mockFetchAll = () => {
  fetch.mockImplementation((url) => {
    const urlStr = url.toString();
    if (urlStr.includes("/datasets")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ data: datasetsMock, total: 1 }),
      });
    }
    return Promise.resolve({ ok: true, json: async () => ({ data: [] }) });
  });
};

const renderComponent = () => {
  return render(
    <MemoryRouter>
      <GestionDatasets />
    </MemoryRouter>
  );
};

/* =========================
   TESTS
========================= */

describe("GestionDatasets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchAll();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
  });

  it("carga datasets y los muestra en la tabla", async () => {
    renderComponent();
    // ✅ Buscamos por texto flexible
    expect(await screen.findByText(/Dataset 1/i)).toBeInTheDocument();
  });

  it("elimina dataset correctamente", async () => {
    renderComponent();
    await screen.findByText(/Dataset 1/i);

    // ✅ Selector por clase ya que el title falló
    const deleteBtn = document.querySelector('.btn-delete');
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/datasets/1"),
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });

  it("no elimina si usuario cancela confirmación", async () => {
    // 1. Forzamos que confirm devuelva false
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    
    renderComponent();
    await screen.findByText(/Dataset 1/i);

    // ✅ TRUCO CLAVE: Limpiamos los mocks después de la carga inicial
    // para que el expect no vea los fetch de "GET" anteriores
    fetch.mockClear();

    const deleteBtn = document.querySelector('.btn-delete');
    fireEvent.click(deleteBtn);

    // 2. Verificamos que confirm se llamó
    expect(confirmSpy).toHaveBeenCalled();

    // 3. Verificamos que NO se haya llamado al fetch de eliminación (DELETE)
    // Ahora fetch.mock.calls estará vacío o solo tendrá llamadas nuevas
    expect(fetch).not.toHaveBeenCalledWith(
      expect.stringContaining("/datasets/1"),
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("cambia a vista EditarDataset", async () => {
    renderComponent();
    await screen.findByText(/Dataset 1/i);

    const editBtn = document.querySelector('.btn-edit');
    fireEvent.click(editBtn);

    expect(await screen.findByText("EditarDataset Mock")).toBeInTheDocument();
  });

  it("limpia los filtros", async () => {
    renderComponent();
    await screen.findByText(/Dataset 1/i);

    const input = screen.getByPlaceholderText(/Nombre del dataset/i);
    fireEvent.change(input, { target: { value: "test" } });
    expect(input.value).toBe("test");

    const btnLimpiar = screen.getByRole("button", { name: /LIMPIAR/i });
    fireEvent.click(btnLimpiar);

    expect(input.value).toBe("");
  });
});