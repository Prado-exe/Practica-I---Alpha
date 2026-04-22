import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, test, expect, beforeEach } from "vitest";
import GestionInstituciones from "../../src/Pages/Admin/GestionInstituciones";
import { MemoryRouter } from "react-router-dom";

// ✅ 1. Corrección de la ruta de AuthContext
vi.mock("../../src/Context/AuthContext", () => ({
  useAuth: () => ({
    user: { token: "fake-token" },
    loading: false
  })
}));

// ✅ 2. Corrección de la ruta de CanView
vi.mock("../../src/Components/Common/CanView", () => ({
  default: ({ children }) => <>{children}</>
}));

// ✅ 3. Corrección de las rutas de los componentes hijos
vi.mock("../../src/Pages/Admin/CrearInstitucion", () => ({
  default: ({ onCancel }) => (
    <div>
      CrearInstitucion Mock
      <button onClick={onCancel}>Cancelar Crear</button>
    </div>
  )
}));

vi.mock("../../src/Pages/Admin/EditarInstitucion", () => ({
  default: ({ onCancel }) => (
    <div>
      EditarInstitucion Mock
      <button onClick={onCancel}>Cancelar Editar</button>
    </div>
  )
}));

// Mock global fetch
global.fetch = vi.fn();

// ✅ 4. Helper de renderizado para evitar errores de navegación (Router)
const renderComponent = () => {
  return render(
    <MemoryRouter>
      <GestionInstituciones />
    </MemoryRouter>
  );
};

describe("GestionInstituciones", () => {

  beforeEach(() => {
    vi.clearAllMocks();
    // Limpiamos los espías de window para evitar contaminación entre tests
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
  });

  test("renderiza y carga instituciones", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        instituciones: [
          {
            institution_id: 1,
            legal_name: "Institución Test",
            short_name: "IT",
            institution_type: "Academica",
            institution_status: "active"
          }
        ]
      })
    });

    renderComponent();

    // Verificamos el título principal
    expect(screen.getByRole("heading", { name: /Instituciones/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Institución Test")).toBeInTheDocument();
    });
  });

  test("filtra instituciones por nombre", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        instituciones: [
          { institution_id: 1, legal_name: "Chile Data", institution_status: "active" },
          { institution_id: 2, legal_name: "Argentina Data", institution_status: "active" }
        ]
      })
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Chile Data")).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/buscar por nombre/i);
    fireEvent.change(input, { target: { value: "Chile" } });

    expect(screen.getByText("Chile Data")).toBeInTheDocument();
    expect(screen.queryByText("Argentina Data")).not.toBeInTheDocument();
  });

  test("abre modal de detalles", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        instituciones: [
          {
            institution_id: 1,
            legal_name: "Inst Detalle",
            institution_type: "ONG",
            country_name: "Chile",
            description: "Descripción test",
            data_role: "Generador",
            access_level: "public",
            institution_status: "active"
          }
        ]
      })
    });

    renderComponent();

    // 1. Confirmamos que cargó en la tabla
    await waitFor(() => {
      expect(screen.getByText("Inst Detalle")).toBeInTheDocument();
    });

    // 2. Abrimos el modal
    const btnVer = screen.getByTitle("Ver detalles");
    fireEvent.click(btnVer);

    // 3. Verificamos el título del modal
    expect(screen.getByRole("heading", { name: /Detalle de la Institucion/i })).toBeInTheDocument();
    
    // ✅ SOLUCIÓN: Usamos getAllByText porque el texto ahora está en la tabla y en el modal
    const elementosConNombre = screen.getAllByText("Inst Detalle");
    expect(elementosConNombre.length).toBeGreaterThan(1);
  });

  test("abre vista de crear institución", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ instituciones: [] })
    });

    renderComponent();

    const btnCrear = await screen.findByText(/Nueva Institución/i);
    fireEvent.click(btnCrear);

    expect(screen.getByText("CrearInstitucion Mock")).toBeInTheDocument();
  });

  test("abre vista de editar institución", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        instituciones: [
          { institution_id: 1, legal_name: "Editar Inst", institution_status: "active" }
        ]
      })
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Editar Inst")).toBeInTheDocument();
    });

    const btnEditar = screen.getByTitle("Editar");
    fireEvent.click(btnEditar);

    expect(screen.getByText("EditarInstitucion Mock")).toBeInTheDocument();
  });

  test("elimina institución correctamente", async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          instituciones: [
            { institution_id: 1, legal_name: "Eliminar Inst", institution_status: "active" }
          ]
        })
      })
      .mockResolvedValueOnce({
        ok: true
      });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Eliminar Inst")).toBeInTheDocument();
    });

    const btnEliminar = screen.getByTitle("Eliminar");
    fireEvent.click(btnEliminar);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Institución eliminada con éxito.");
    });
  });

  test("limpia filtros correctamente", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ instituciones: [] })
    });

    renderComponent();

    const input = screen.getByPlaceholderText(/buscar por nombre/i);
    fireEvent.change(input, { target: { value: "Test" } });

    expect(input.value).toBe("Test");

    const btnLimpiar = screen.getByRole("button", { name: /LIMPIAR/i });
    fireEvent.click(btnLimpiar);

    expect(input.value).toBe("");
  });

});