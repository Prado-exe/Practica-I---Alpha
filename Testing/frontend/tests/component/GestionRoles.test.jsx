import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import GestionRoles from "../../src/Pages/Admin/GestionRoles";

// Mock Auth
vi.mock("../../Context/AuthContext", () => ({
  useAuth: () => ({
    user: { token: "fake-token" }
  })
}));

// Mock CanView
vi.mock("../../Components/Common/CanView", () => ({
  default: ({ children }) => <>{children}</>
}));

// Mock fetch global
global.fetch = vi.fn();

describe("GestionRoles", () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renderiza roles desde API", async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          roles: [
            {
              role_id: 1,
              name: "Admin",
              code: "admin",
              cantidad_permisos: 3,
              cantidad_usuarios: 5
            }
          ]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ permisos: [] })
      });

    render(<GestionRoles />);

    await waitFor(() => {
      expect(screen.getByText("Admin")).toBeInTheDocument();
      expect(screen.getByText(/3 permisos/i)).toBeInTheDocument();
    });
  });

  test("abre modal para crear rol", async () => {
    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ roles: [] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ permisos: [] }) });

    render(<GestionRoles />);

    const btnCrear = await screen.findByText(/crear rol/i);
    fireEvent.click(btnCrear);

    expect(screen.getByText(/Crear Nuevo Rol/i)).toBeInTheDocument();
  });

  test("abre modal para editar rol", async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          roles: [
            {
              role_id: 1,
              name: "Editor",
              code: "editor",
              description: "desc",
              cantidad_permisos: 2,
              cantidad_usuarios: 1,
              permisos_ids: [1]
            }
          ]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          permisos: [
            { permission_id: 1, code: "read" }
          ]
        })
      });

    render(<GestionRoles />);

    const btnEditar = await screen.findByText("Editar");
    fireEvent.click(btnEditar);

    expect(screen.getByText(/Editar Rol/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue("Editor")).toBeInTheDocument();
  });

  test("no permite enviar sin permisos", async () => {
    window.alert = vi.fn();

    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ roles: [] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ permisos: [] }) });

    render(<GestionRoles />);

    fireEvent.click(await screen.findByText(/crear rol/i));

    const btnSubmit = screen.getByText(/Crear Rol/i);
    fireEvent.click(btnSubmit);

    expect(window.alert).toHaveBeenCalledWith(
      "Debes seleccionar al menos un permiso para este rol."
    );
  });

  test("crea rol correctamente", async () => {
    window.alert = vi.fn();

    fetch
      // roles
      .mockResolvedValueOnce({ ok: true, json: async () => ({ roles: [] }) })
      // permisos
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          permisos: [{ permission_id: 1, code: "read" }]
        })
      })
      // POST
      .mockResolvedValueOnce({ ok: true });

    render(<GestionRoles />);

    fireEvent.click(await screen.findByText(/crear rol/i));

    fireEvent.change(screen.getByPlaceholderText(/observador/i), {
      target: { value: "Nuevo Rol" }
    });

    fireEvent.change(screen.getByPlaceholderText(/data_observer/i), {
      target: { value: "nuevo_rol" }
    });

    fireEvent.change(screen.getByPlaceholderText(/breve descripción/i), {
      target: { value: "desc test" }
    });

    // seleccionar permiso
    const checkbox = await screen.findByRole("checkbox");
    fireEvent.click(checkbox);

    fireEvent.click(screen.getByText(/Crear Rol/i));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Rol creado correctamente");
    });
  });

  test("elimina rol correctamente", async () => {
    window.confirm = vi.fn(() => true);
    window.alert = vi.fn();

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          roles: [
            {
              role_id: 1,
              name: "Eliminar Rol",
              code: "custom",
              cantidad_usuarios: 2
            }
          ]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ permisos: [] })
      })
      .mockResolvedValueOnce({
        ok: true
      });

    render(<GestionRoles />);

    const btnEliminar = await screen.findByText(/Eliminar/i);
    fireEvent.click(btnEliminar);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Rol eliminado. Usuarios reasignados.");
    });
  });

  test("bloquea eliminación de roles protegidos", async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          roles: [
            {
              role_id: 1,
              name: "Super Admin",
              code: "super_admin",
              cantidad_usuarios: 1
            }
          ]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ permisos: [] })
      });

    render(<GestionRoles />);

    const btnProtegido = await screen.findByText(/Protegido/i);

    expect(btnProtegido).toBeDisabled();
  });

});