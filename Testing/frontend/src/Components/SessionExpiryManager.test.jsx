// SessionExpiryManager.test.jsx
import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import SessionExpiryManager from "./SessionExpiryManager";

// 🔥 mocks router
const navigateMock = vi.fn();

vi.mock("react-router-dom", () => ({
  useLocation: () => ({ pathname: "/dashboard" }),
  useNavigate: () => navigateMock,
}));

// 🔥 mocks auth utils
vi.mock("../utils/auth", () => ({
  getAuthToken: vi.fn(),
  getAuthExpiresAt: vi.fn(),
  getAuthUser: vi.fn(),
  hasRefreshHint: vi.fn(),
  setAuthSession: vi.fn(),
  clearAuthSession: vi.fn(),
  clearAllAuthState: vi.fn(),
}));

import * as auth from "../utils/auth";

describe("SessionExpiryManager", () => {

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    global.fetch = vi.fn();
  });

  it("no hace nada si no hay token ni expiresAt", () => {
    auth.getAuthToken.mockReturnValue(null);
    auth.getAuthExpiresAt.mockReturnValue(null);
    auth.hasRefreshHint.mockReturnValue(false);

    render(<SessionExpiryManager />);

    expect(auth.clearAuthSession).toHaveBeenCalled();
  });

  it("intenta refresh si hay refreshHint pero no token", async () => {
    auth.getAuthToken.mockReturnValue(null);
    auth.getAuthExpiresAt.mockReturnValue(null);
    auth.hasRefreshHint.mockReturnValue(true);

    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        token: "new-token",
        expiresAt: new Date(Date.now() + 10000).toISOString(),
        account: { name: "test" },
      }),
    });

    render(<SessionExpiryManager />);

    await Promise.resolve(); // flush microtasks

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/refresh"),
      expect.objectContaining({
        method: "POST",
        credentials: "include",
      })
    );
  });

  it("guarda sesión cuando refresh es exitoso", async () => {
    auth.getAuthToken.mockReturnValue(null);
    auth.getAuthExpiresAt.mockReturnValue(null);
    auth.hasRefreshHint.mockReturnValue(true);
    auth.getAuthUser.mockReturnValue({ name: "old" });

    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        token: "new-token",
        expiresAt: new Date(Date.now() + 10000).toISOString(),
        account: { name: "new" },
      }),
    });

    render(<SessionExpiryManager />);

    await Promise.resolve();

    expect(auth.setAuthSession).toHaveBeenCalled();
  });

  it("limpia sesión si refresh falla", async () => {
    auth.getAuthToken.mockReturnValue(null);
    auth.getAuthExpiresAt.mockReturnValue(null);
    auth.hasRefreshHint.mockReturnValue(true);

    fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ ok: false }),
    });

    render(<SessionExpiryManager />);

    await Promise.resolve();

    expect(auth.clearAllAuthState).toHaveBeenCalled();
  });

  it("redirige a login si refresh falla en ruta privada", async () => {
    auth.getAuthToken.mockReturnValue(null);
    auth.getAuthExpiresAt.mockReturnValue(null);
    auth.hasRefreshHint.mockReturnValue(true);

    fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ ok: false }),
    });

    render(<SessionExpiryManager />);

    await Promise.resolve();

    expect(navigateMock).toHaveBeenCalledWith("/login", { replace: true });
  });

  it("programa refresh antes de expiración", async () => {
    const futureDate = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    auth.getAuthToken.mockReturnValue("token");
    auth.getAuthExpiresAt.mockReturnValue(futureDate);

    render(<SessionExpiryManager />);

    // avanzar timers
    vi.runOnlyPendingTimers();

    expect(fetch).toHaveBeenCalled();
  });

});