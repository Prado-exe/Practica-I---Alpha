// AuthProvider.test.jsx
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthProvider, useAuth } from "../../src/Context/AuthContext";

// 🔥 componente helper
function TestComponent() {
  const { user, login, logout, loading } = useAuth();

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <span data-testid="user">
        {user ? user.name : "no-user"}
      </span>

      <button onClick={() => login({ name: "test-user" })}>
        login
      </button>

      <button onClick={logout}>
        logout
      </button>
    </div>
  );
}

describe("AuthProvider", () => {

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("muestra loading al inicio", () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ ok: false }),
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("setea usuario si refresh es exitoso", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        token: "abc",
        account: { name: "usuario" },
        expiresAt: "123",
      }),
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("usuario");
    });
  });

  it("deja user en null si backend responde 401", async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ ok: false }),
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("no-user");
    });
  });

  it("NO borra usuario si hay error de red", async () => {
    fetch.mockRejectedValue(new Error("network error"));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("no-user");
    });
  });

  it("login actualiza el usuario", async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ ok: false }),
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      fireEvent.click(screen.getByText("login"));
    });

    expect(screen.getByTestId("user").textContent).toBe("test-user");
  });

  it("logout limpia usuario y llama al backend", async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          token: "abc",
          account: { name: "usuario" },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
      });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("usuario");
    });

    fireEvent.click(screen.getByText("logout"));

    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("no-user");
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/logout"),
      expect.objectContaining({
        method: "POST",
        credentials: "include",
      })
    );
  });

});