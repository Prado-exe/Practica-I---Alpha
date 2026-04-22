import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import GestionRoles from "../../src/Pages/Admin/GestionRoles";
import { MemoryRouter } from "react-router-dom";

// ✅ 1. Corregimos la ruta del Mock Auth
vi.mock("../../src/Context/AuthContext", () => ({
  useAuth: () => ({
    user: { 
      token: "fake-token",
      name: "Admin Test",
      permissions: ["roles.manage"] 
    },
    loading: false
  })
}));

// ✅ 2. Mock CanView
vi.mock("../../src/Components/Common/CanView", () => ({
  default: ({ children }) => <div data-testid="can-view">{children}</div>
}));

// Mock fetch global
global.fetch = vi.fn();

// ✅ 3. Helper para renderizar con Router
const renderComponent = () => {
  return render(
    <MemoryRouter>
      <GestionRoles />
    </MemoryRouter>
  );
};

describe("GestionRoles", () => {

  beforeEach(() => {
    vi.clearAllMocks();
    // Limpiar alertas de window para cada test
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
  });

  it("renderiza roles desde API", async () => {
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

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Admin")).toBeInTheDocument();
      expect(screen.getByText(/3 permisos/i)).toBeInTheDocument();
    });
  });

  it("abre modal para crear rol", async () => {
    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ roles: [] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ permisos: [] }) });

    renderComponent();

    const btnCrear = await screen.findByRole("button", { name: "+ Crear Rol" });
    fireEvent.click(btnCrear);

    expect(screen.getByText(/Crear Nuevo Rol/i)).toBeInTheDocument();
  });

  it("abre modal para editar rol", async () => {
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
            { permission_id: 1, code: "read", name: "Leer" }
          ]
        })
      });

    renderComponent();

    const btnEditar = await screen.findByRole("button", { name: "Editar" });
    fireEvent.click(btnEditar);

    expect(screen.getByText(/Editar Rol/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue("Editor")).toBeInTheDocument();
  });

  it("no permite enviar sin permisos", async () => {
    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ roles: [] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ permisos: [] }) });

    renderComponent();

    const btnAbrir = await screen.findByRole("button", { name: "+ Crear Rol" });
    fireEvent.click(btnAbrir);

    // Llenamos los campos de texto
    const inputNombre = await screen.findByPlaceholderText(/observador/i);
    fireEvent.change(inputNombre, { target: { value: "Test Rol" } });
    fireEvent.change(screen.getByPlaceholderText(/data_observer/i), { target: { value: "test_rol" } });
    fireEvent.change(screen.getByPlaceholderText(/breve descripción/i), { target: { value: "test desc" } });

    // ✅ En lugar de hacer click y esperar un alert, comprobamos que el botón está deshabilitado
    const btnSubmit = screen.getByRole("button", { name: "Crear Rol" });
    expect(btnSubmit).toBeDisabled();
  });

  it("crea rol correctamente", async () => {
    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ roles: [] }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          permisos: [{ permission_id: 1, code: "read", name: "Leer" }]
        })
      })
      .mockResolvedValueOnce({ 
        ok: true, 
        json: async () => ({ ok: true, message: "Rol creado correctamente" }) 
      });

    renderComponent();

    const btnAbrir = await screen.findByRole("button", { name: "+ Crear Rol" });
    fireEvent.click(btnAbrir);

    fireEvent.change(screen.getByPlaceholderText(/observador/i), {
      target: { value: "Nuevo Rol" }
    });

    fireEvent.change(screen.getByPlaceholderText(/data_observer/i), {
      target: { value: "nuevo_rol" }
    });

    fireEvent.change(screen.getByPlaceholderText(/breve descripción/i), {
      target: { value: "desc test" }
    });

    // Seleccionamos permiso (esto habilitará el botón)
    const checkbox = await screen.findByRole("checkbox");
    fireEvent.click(checkbox);

    const btnSubmit = screen.getByRole("button", { name: "Crear Rol" });
    
    // Verificamos que ahora sí está habilitado y hacemos click
    expect(btnSubmit).not.toBeDisabled();
    fireEvent.click(btnSubmit);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Rol creado correctamente");
    });
  });

  it("elimina rol correctamente", async () => {
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
        ok: true,
        json: async () => ({ message: "Rol eliminado. Usuarios reasignados." })
      });

    renderComponent();

    const btnEliminar = await screen.findByRole("button", { name: "Eliminar" });
    fireEvent.click(btnEliminar);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Rol eliminado. Usuarios reasignados.");
    });
  });

  it("bloquea eliminación de roles protegidos", async () => {
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

    renderComponent();

    // Esperamos a que la tabla se dibuje
    await waitFor(() => {
      expect(screen.getByText("Super Admin")).toBeInTheDocument();
    });

    const elementoProtegido = screen.getByText(/Protegido/i);
    
    // Verificamos que el botón (o el elemento que lo contenga) esté deshabilitado
    const btn = elementoProtegido.tagName === 'BUTTON' 
      ? elementoProtegido 
      : elementoProtegido.closest('button');

    expect(btn).toBeDisabled();
  });

});