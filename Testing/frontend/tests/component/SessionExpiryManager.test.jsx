import { render, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import SessionExpiryManager from "../../src/Components/SessionExpiryManager";
import * as auth from "../../src/utils/auth";

const navigateMock = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useLocation: () => ({ pathname: "/dashboard" }), 
    useNavigate: () => navigateMock,
  };
});

vi.mock("../../src/utils/auth", () => ({
  getAuthToken: vi.fn(),
  getAuthExpiresAt: vi.fn(),
  getAuthUser: vi.fn(),
  hasRefreshHint: vi.fn(),
  setAuthSession: vi.fn(),
  clearAuthSession: vi.fn(),
  clearAllAuthState: vi.fn(),
  isSessionExpired: vi.fn()
}));

describe("SessionExpiryManager", () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    // Estado base: sesión válida
    vi.mocked(auth.isSessionExpired).mockReturnValue(false);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("guarda sesión cuando refresh es exitoso", async () => {
    vi.mocked(auth.hasRefreshHint).mockReturnValue(true);
    vi.mocked(auth.getAuthToken).mockReturnValue(null);
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, token: "new", expiresAt: "2099-01-01T00:00:00Z" }),
    });

    render(<MemoryRouter><SessionExpiryManager /></MemoryRouter>);
    await waitFor(() => expect(auth.setAuthSession).toHaveBeenCalled());
  });

  it("limpia sesión si refresh falla (Error de Red)", async () => {
    vi.mocked(auth.hasRefreshHint).mockReturnValue(true);
    vi.mocked(auth.getAuthToken).mockReturnValue(null);
    
    // Forzamos el rechazo de la promesa
    fetch.mockRejectedValue(new Error("Network Error"));

    render(<MemoryRouter><SessionExpiryManager /></MemoryRouter>);

    // ✅ La clave es usar un intervalo de reintento más agresivo en waitFor
    await waitFor(() => {
      expect(auth.clearAllAuthState).toHaveBeenCalled();
    }, { timeout: 2000, interval: 50 });
  });

  it("redirige a login si refresh falla (401 Unauthorized)", async () => {
    vi.mocked(auth.hasRefreshHint).mockReturnValue(true);
    vi.mocked(auth.getAuthToken).mockReturnValue(null);
    // Para navegar, el componente suele chequear si ya expiró
    vi.mocked(auth.isSessionExpired).mockReturnValue(true);

    fetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ ok: false }),
    });

    render(<MemoryRouter><SessionExpiryManager /></MemoryRouter>);

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith("/login", { replace: true });
    }, { timeout: 2000 });
  });

  it("programa refresh antes de expiración", async () => {
    // 1. Congelamos el tiempo ANTES de cualquier lógica
    vi.useFakeTimers();
    const now = Date.now();
    vi.setSystemTime(now);

    // Token que expira en 10 min
    const future = new Date(now + 10 * 60 * 1000).toISOString();
    vi.mocked(auth.getAuthToken).mockReturnValue("valid");
    vi.mocked(auth.getAuthExpiresAt).mockReturnValue(future);
    vi.mocked(auth.hasRefreshHint).mockReturnValue(true);

    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, token: "refreshed" })
    });

    render(<MemoryRouter><SessionExpiryManager /></MemoryRouter>);

    // 2. Avanzamos el tiempo. 
    // Usamos advanceTimersByTime de forma síncrona dentro de un act asíncrono
    await act(async () => {
      vi.advanceTimersByTime(9 * 60 * 1000);
    });

    // 3. Verificamos que se llamó al fetch
    await waitFor(() => expect(fetch).toHaveBeenCalled());
  });
});