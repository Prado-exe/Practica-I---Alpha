import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthProvider, useAuth } from "../../src/Context/AuthContext";
import * as authUtils from "../../src/utils/auth";

// Mock de utilidades
vi.mock("../../src/utils/auth", async () => {
  const actual = await vi.importActual("../../src/utils/auth");
  return { ...actual, hasRefreshHint: vi.fn() };
});

const TestComponent = () => {
  const { user, loading } = useAuth();
  // Este componente solo se verá cuando loading sea FALSE
  return <div data-testid="content">{user ? `Usuario: ${user.name}` : "No autenticado"}</div>;
};

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    vi.mocked(authUtils.hasRefreshHint).mockReturnValue(true);
  });

  it("mantiene el estado de carga al inicio (hijos ocultos)", async () => {
    // 1. Promesa pendiente
    let resolvePending;
    const pendingPromise = new Promise((resolve) => { resolvePending = resolve; });
    global.fetch = vi.fn().mockReturnValue(pendingPromise);

    const { container } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // 2. ✅ VALIDACIÓN CORRECTA:
    // Mientras carga, el body debe estar vacío (o sin el contenido del hijo)
    // porque el Provider bloquea el renderizado de children.
    expect(screen.queryByTestId("content")).not.toBeInTheDocument();
    expect(container.firstChild).toBeNull(); 

    // 3. Resolvemos la promesa
    resolvePending({
      ok: true,
      json: async () => ({ ok: true, user: { name: "Juan" }, token: "abc" }),
    });

    // 4. Ahora el contenido DEBE aparecer
    const content = await screen.findByTestId("content", {}, { timeout: 2000 });
    expect(content).toHaveTextContent(/Usuario: Juan/i);
  });

  it("setea usuario si refresh es exitoso", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, user: { name: "Juan" }, token: "abc" }),
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const userText = await screen.findByText(/Usuario: Juan/i);
    expect(userText).toBeInTheDocument();
  });
});