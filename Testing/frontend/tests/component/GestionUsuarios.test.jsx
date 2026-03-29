import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import GestionUsuarios from "../../src/Pages/Admin/GestionUsuarios";

// 🔥 MOCKS
vi.mock("../../Context/AuthContext", () => ({
  useAuth: () => ({
    user: {
      token: "fake-token",
      sub: "1" // para ocultar usuario actual
    }
  })
}));

vi.mock("../../Components/Common/CanView", () => ({
  default: ({ children }) => <>{children}</>
}));

vi.mock("../../Components/Common/SearchBarAdvanced", () => ({
  default: ({ value, onChange }) => (
    <input
      data-testid="search-input"
      value={value}
      onChange={onChange}
    />
  )
}));

vi.mock("../../Components/Common/Pagination", () => ({
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

describe("GestionUsuarios", () => {

  beforeEach(() => {
    vi.clearAllMocks();

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
    render(<GestionUsuarios />);

    expect(screen.getByText("Gestión de Usuarios")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Juan Perez")).toBeInTheDocument();
    });
  });

  it("muestra usuarios desde la API", async () => {
    render(<GestionUsuarios />);

    await waitFor(() => {
      expect(screen.getByText("Maria Lopez")).toBeInTheDocument();
    });
  });

  it("filtra usuarios por búsqueda", async () => {
    render(<GestionUsuarios />);

    await waitFor(() => {
      expect(screen.getByText("Juan Perez")).toBeInTheDocument();
    });

    const input = screen.getByTestId("search-input");

    fireEvent.change(input, { target: { value: "maria" } });

    expect(screen.queryByText("Juan Perez")).not.toBeInTheDocument();
    expect(screen.getByText("Maria Lopez")).toBeInTheDocument();
  });

  it("abre el modal de edición", async () => {
    render(<GestionUsuarios />);

    await waitFor(() => {
      expect(screen.getByText("Juan Perez")).toBeInTheDocument();
    });

    const editBtn = screen.getAllByText("Editar")[0];
    fireEvent.click(editBtn);

    expect(screen.getByText("Editar Usuario")).toBeInTheDocument();
  });

  it("elimina un usuario", async () => {
    window.confirm = vi.fn(() => true);

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

    render(<GestionUsuarios />);

    await waitFor(() => {
      expect(screen.getByText("Juan Perez")).toBeInTheDocument();
    });

    const deleteBtn = screen.getAllByText("Eliminar")[0];
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/usuarios/2"),
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });

  it("cambia de página", async () => {
    render(<GestionUsuarios />);

    await waitFor(() => {
      expect(screen.getByTestId("pagination")).toBeInTheDocument();
    });

    const nextBtn = screen.getByText("Next");
    fireEvent.click(nextBtn);

    expect(screen.getByText(/Página 2/)).toBeInTheDocument();
  });

});