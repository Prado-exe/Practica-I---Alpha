import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import GestionUsuarios from "../../src/Pages/Admin/GestionUsuarios";
import { MemoryRouter } from "react-router-dom"; // ✅ Importamos el Router

// 🔥 MOCKS (✅ Añadimos src/ a todas las rutas)
vi.mock("../../src/Context/AuthContext", () => ({
  useAuth: () => ({
    user: {
      token: "fake-token",
      sub: "1" // para ocultar usuario actual
    }
  })
}));

vi.mock("../../src/Components/Common/CanView", () => ({
  default: ({ children }) => <>{children}</>
}));

vi.mock("../../src/Components/Common/SearchBarAdvanced", () => ({
  default: ({ value, onChange }) => (
    <input
      data-testid="search-input"
      value={value || ""}
      onChange={onChange}
    />
  )
}));

vi.mock("../../src/Components/Common/Pagination", () => ({
  default: ({ currentPage, totalPages, onPageChange }) => (
    <div>
      <span data-testid="pagination">
        Página {currentPage} de {totalPages}
      </span>
      <button onClick={() => onPageChange(currentPage + 1)}>Next</button>
    </div>
  )
}));

// 🌐 MOCK FETCH GLOBAL
global.fetch = vi.fn();

const mockUsuarios = [
  {
    account_id: "2",
    full_name: "Juan Perez",
    email: "juan@test.com",
    role_code: "registered_user",
    account_status: "active"
  },
  {
    account_id: "3",
    full_name: "Maria Lopez",
    email: "maria@test.com",
    role_code: "data_admin",
    account_status: "inactive"
  }
];

const mockRoles = [
  { code: "registered_user", name: "Usuario" },
  { code: "data_admin", name: "Admin Datos" }
];

// ✅ Helper para renderizar con Router
const renderComponent = () => {
  return render(
    <MemoryRouter>
      <GestionUsuarios />
    </MemoryRouter>
  );
};

describe("GestionUsuarios", () => {

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Protegemos el test contra alertas nativas del navegador
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
    vi.spyOn(window, 'alert').mockImplementation(() => {});

    fetch.mockImplementation((url) => {
      if (url.includes("/usuarios")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ usuarios: mockUsuarios })
        });
      }

      if (url.includes("/roles")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ roles: mockRoles })
        });
      }

      return Promise.resolve({ ok: true, json: () => ({}) });
    });
  });

  it("renderiza el componente correctamente", async () => {
    renderComponent();

    // Verificamos el título
    expect(screen.getByRole("heading", { name: /Gestión de Usuarios/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Juan Perez")).toBeInTheDocument();
    });
  });

  it("muestra usuarios desde la API", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Maria Lopez")).toBeInTheDocument();
    });
  });

  it("filtra usuarios por búsqueda", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Juan Perez")).toBeInTheDocument();
    });

    const input = screen.getByTestId("search-input");

    // Simulamos la escritura en el buscador
    fireEvent.change(input, { target: { value: "maria" } });

    await waitFor(() => {
      expect(screen.queryByText("Juan Perez")).not.toBeInTheDocument();
      expect(screen.getByText("Maria Lopez")).toBeInTheDocument();
    });
  });

  it("abre el modal de edición", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Juan Perez")).toBeInTheDocument();
    });

    // Buscamos los botones de editar y hacemos clic en el primero
    const editBtn = screen.getAllByText(/Editar/i)[0];
    fireEvent.click(editBtn);

    expect(await screen.findByText(/Editar Usuario/i)).toBeInTheDocument();
  });

  it("elimina un usuario", async () => {
    fetch.mockImplementation((url, options) => {
      if (options?.method === "DELETE") {
        return Promise.resolve({ ok: true });
      }

      if (url.includes("/usuarios")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ usuarios: mockUsuarios })
        });
      }

      if (url.includes("/roles")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ roles: mockRoles })
        });
      }

      return Promise.resolve({ ok: true, json: () => ({}) });
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Juan Perez")).toBeInTheDocument();
    });

    // Buscamos el primer botón de eliminar
    const deleteBtn = screen.getAllByText(/Eliminar/i)[0];
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/usuarios/2"),
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });

  it("cambia de página", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("pagination")).toBeInTheDocument();
    });

    const nextBtn = screen.getByText("Next");
    fireEvent.click(nextBtn);

    expect(screen.getByText(/Página 2/)).toBeInTheDocument();
  });

});