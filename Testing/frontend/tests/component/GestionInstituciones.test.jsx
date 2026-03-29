import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import GestionInstituciones from "../../src/Pages/Admin/GestionInstituciones";

// Mock de useAuth
vi.mock("../../Context/AuthContext", () => ({
  useAuth: () => ({
    user: { token: "fake-token" }
  })
}));

// Mock de CanView (para no depender de permisos)
vi.mock("../../Components/Common/CanView", () => ({
  default: ({ children }) => <>{children}</>
}));

// Mock de componentes hijos
vi.mock("./CrearInstitucion", () => ({
  default: ({ onCancel }) => (
    <div>
      CrearInstitucion Mock
      <button onClick={onCancel}>Cancelar Crear</button>
    </div>
  )
}));

vi.mock("./EditarInstitucion", () => ({
  default: ({ onCancel }) => (
    <div>
      EditarInstitucion Mock
      <button onClick={onCancel}>Cancelar Editar</button>
    </div>
  )
}));

// Mock global fetch
global.fetch = vi.fn();

describe("GestionInstituciones", () => {

  beforeEach(() => {
    vi.clearAllMocks();
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

    render(<GestionInstituciones />);

    expect(screen.getByText(/Instituciones/i)).toBeInTheDocument();

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

    render(<GestionInstituciones />);

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

    render(<GestionInstituciones />);

    await waitFor(() => {
      expect(screen.getByText("Inst Detalle")).toBeInTheDocument();
    });

    const btnVer = screen.getByTitle("Ver detalles");
    fireEvent.click(btnVer);

    expect(screen.getByText(/Detalle de la Institucion/i)).toBeInTheDocument();
    expect(screen.getByText("Inst Detalle")).toBeInTheDocument();
  });

  test("abre vista de crear institución", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ instituciones: [] })
    });

    render(<GestionInstituciones />);

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

    render(<GestionInstituciones />);

    await waitFor(() => {
      expect(screen.getByText("Editar Inst")).toBeInTheDocument();
    });

    const btnEditar = screen.getByTitle("Editar");
    fireEvent.click(btnEditar);

    expect(screen.getByText("EditarInstitucion Mock")).toBeInTheDocument();
  });

  test("elimina institución correctamente", async () => {
    window.confirm = vi.fn(() => true);
    window.alert = vi.fn();

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

    render(<GestionInstituciones />);

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

    render(<GestionInstituciones />);

    const input = screen.getByPlaceholderText(/buscar por nombre/i);
    fireEvent.change(input, { target: { value: "Test" } });

    expect(input.value).toBe("Test");

    const btnLimpiar = screen.getByText(/LIMPIAR/i);
    fireEvent.click(btnLimpiar);

    expect(input.value).toBe("");
  });

});