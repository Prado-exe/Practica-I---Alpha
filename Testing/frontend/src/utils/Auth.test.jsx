import {
  setAuthSession,
  clearAuthSession,
  clearAllAuthState,
  getAuthToken,
  getAuthUser,
  getAuthExpiresAt,
  hasRefreshHint,
  getRemainingSessionTimeMs,
  isSessionExpired,
} from "../utils/auth"; // ajusta la ruta

describe("auth utils", () => {

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  test("setAuthSession guarda datos correctamente", () => {
    const user = { name: "Juan" };
    const expiresAt = new Date(Date.now() + 10000).toISOString();

    setAuthSession({
      token: "abc123",
      user,
      expiresAt
    });

    expect(getAuthToken()).toBe("abc123");
    expect(getAuthUser()).toEqual(user);
    expect(getAuthExpiresAt()).toBe(expiresAt);
    expect(hasRefreshHint()).toBe(true);
  });

  test("clearAuthSession elimina solo sessionStorage", () => {
    setAuthSession({
      token: "abc",
      user: { name: "Test" },
      expiresAt: new Date().toISOString()
    });

    clearAuthSession();

    expect(getAuthToken()).toBe(null);
    expect(getAuthUser()).toBe(null);
    expect(getAuthExpiresAt()).toBe(null);

    // 👇 localStorage sigue intacto
    expect(hasRefreshHint()).toBe(true);
  });

  test("clearAllAuthState elimina todo", () => {
    setAuthSession({
      token: "abc",
      user: { name: "Test" },
      expiresAt: new Date().toISOString()
    });

    clearAllAuthState();

    expect(getAuthToken()).toBe(null);
    expect(hasRefreshHint()).toBe(false);
  });

  test("getAuthUser maneja JSON inválido", () => {
    sessionStorage.setItem("authUser", "INVALID_JSON");

    expect(getAuthUser()).toBe(null);
  });

  test("getRemainingSessionTimeMs retorna tiempo restante", () => {
    const future = new Date(Date.now() + 5000).toISOString();

    setAuthSession({
      token: "abc",
      user: {},
      expiresAt: future
    });

    const remaining = getRemainingSessionTimeMs();

    expect(remaining).toBeGreaterThan(0);
  });

  test("getRemainingSessionTimeMs retorna 0 si no hay sesión", () => {
    expect(getRemainingSessionTimeMs()).toBe(0);
  });

  test("isSessionExpired retorna true si expiró", () => {
    const past = new Date(Date.now() - 5000).toISOString();

    setAuthSession({
      token: "abc",
      user: {},
      expiresAt: past
    });

    expect(isSessionExpired()).toBe(true);
  });

  test("isSessionExpired retorna false si sigue vigente", () => {
    const future = new Date(Date.now() + 5000).toISOString();

    setAuthSession({
      token: "abc",
      user: {},
      expiresAt: future
    });

    expect(isSessionExpired()).toBe(false);
  });

});