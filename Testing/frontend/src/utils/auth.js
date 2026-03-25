const TOKEN_KEY = "token";
const USER_KEY = "authUser";
const EXPIRES_AT_KEY = "authExpiresAt";
const REFRESH_HINT_KEY = "authRefreshHint";

function setAuthSession({ token, user, expiresAt }) {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  sessionStorage.setItem(EXPIRES_AT_KEY, String(expiresAt));

  localStorage.setItem(REFRESH_HINT_KEY, "1");
}

function clearAuthSession() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(EXPIRES_AT_KEY);
}

function clearAllAuthState() {
  clearAuthSession();
  localStorage.removeItem(REFRESH_HINT_KEY);
}

function getAuthToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

function getAuthUser() {
  const raw = sessionStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getAuthExpiresAt() {
  return sessionStorage.getItem(EXPIRES_AT_KEY);
}

function hasRefreshHint() {
  return localStorage.getItem(REFRESH_HINT_KEY) === "1";
}

function getRemainingSessionTimeMs() {
  const expiresAt = getAuthExpiresAt();
  if (!expiresAt) return 0;

  return Math.max(new Date(expiresAt).getTime() - Date.now(), 0);
}

function isSessionExpired() {
  const expiresAt = getAuthExpiresAt();
  if (!expiresAt) return true;

  return new Date(expiresAt).getTime() <= Date.now();
}

export {
  TOKEN_KEY,
  USER_KEY,
  EXPIRES_AT_KEY,
  REFRESH_HINT_KEY,
  setAuthSession,
  clearAuthSession,
  clearAllAuthState,
  getAuthToken,
  getAuthUser,
  getAuthExpiresAt,
  hasRefreshHint,
  getRemainingSessionTimeMs,
  isSessionExpired,
};