import { useCallback, useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  clearAllAuthState,
  clearAuthSession,
  getAuthExpiresAt,
  getAuthToken,
  getAuthUser,
  hasRefreshHint,
  setAuthSession,
} from "../utils/auth";

const API_URL = import.meta.env.VITE_API_URL || "http://3.139.202.192:3000";
const REFRESH_BEFORE_MS = 5 * 60 * 1000;

let bootstrapAttempted = false;
let refreshPromise = null;

function SessionExpiryManager() {
  const location = useLocation();
  const navigate = useNavigate();
  const refreshTimeoutRef = useRef(null);

  const publicRoutes = useMemo(
    () => ["/", "/login", "/register", "/recuperar-password", "/reset-password", "/verificacion"],
    []
  );

  const isPublicRoute = publicRoutes.includes(location.pathname);

  const stopRefreshTimer = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
  }, []);

  const clearLocalSessionOnly = useCallback(() => {
    stopRefreshTimer();
    clearAuthSession();
    window.dispatchEvent(new Event("auth-changed"));
  }, [stopRefreshTimer]);

  const clearEverything = useCallback(() => {
    stopRefreshTimer();
    clearAllAuthState();
    window.dispatchEvent(new Event("auth-changed"));
  }, [stopRefreshTimer]);

  const refreshSession = useCallback(
    async ({ redirectOnFail = false, silent = false } = {}) => {
      if (refreshPromise) {
        return refreshPromise;
      }

      refreshPromise = (async () => {
        try {
          const response = await fetch(`${API_URL}/api/refresh`, {
            method: "POST",
            credentials: "include",
          });

          const data = await response.json();

          if (!response.ok || !data.ok) {
            throw new Error(data.message || "No se pudo renovar la sesión");
          }

          const currentUser = getAuthUser();

          setAuthSession({
            token: data.token,
            user: data.account ?? currentUser,
            expiresAt: data.expiresAt,
          });

          window.dispatchEvent(new Event("auth-changed"));
          return true;
        } catch (error) {
          clearEverything();

          if (!silent) {
            console.error("Error al renovar la sesión:", error);
          }

          if (redirectOnFail && !isPublicRoute) {
            navigate("/login", { replace: true });
          }

          return false;
        } finally {
          refreshPromise = null;
        }
      })();

      return refreshPromise;
    },
    [clearEverything, isPublicRoute, navigate]
  );

  const scheduleRefresh = useCallback(() => {
    stopRefreshTimer();

    const token = getAuthToken();
    const expiresAt = getAuthExpiresAt();

    if (!token || !expiresAt) {
      return;
    }

    const expiresAtMs = new Date(expiresAt).getTime();
    const now = Date.now();
    const delay = Math.max(expiresAtMs - now - REFRESH_BEFORE_MS, 0);

    refreshTimeoutRef.current = setTimeout(async () => {
      const ok = await refreshSession({
        redirectOnFail: true,
        silent: false,
      });

      if (ok) {
        scheduleRefresh();
      }
    }, delay);
  }, [refreshSession, stopRefreshTimer]);

  const bootstrapSession = useCallback(async () => {
    const token = getAuthToken();
    const expiresAt = getAuthExpiresAt();

    if (token && expiresAt) {
      scheduleRefresh();
      return;
    }

    // Si nunca hubo sesión, no intentes refresh
    if (!hasRefreshHint()) {
      clearLocalSessionOnly();
      return;
    }

    const ok = await refreshSession({
      redirectOnFail: !isPublicRoute,
      silent: isPublicRoute,
    });

    if (ok) {
      scheduleRefresh();
    }
  }, [clearLocalSessionOnly, isPublicRoute, refreshSession, scheduleRefresh]);

  useEffect(() => {
    if (!bootstrapAttempted) {
      bootstrapAttempted = true;
      void bootstrapSession();
    } else {
      const token = getAuthToken();
      const expiresAt = getAuthExpiresAt();

      if (token && expiresAt) {
        scheduleRefresh();
      }
    }

    return () => {
      stopRefreshTimer();
    };
  }, [bootstrapSession, scheduleRefresh, stopRefreshTimer]);

  useEffect(() => {
    const token = getAuthToken();
    const expiresAt = getAuthExpiresAt();

    if (!token || !expiresAt) {
      stopRefreshTimer();
      return;
    }

    scheduleRefresh();

    return () => {
      stopRefreshTimer();
    };
  }, [location.pathname, scheduleRefresh, stopRefreshTimer]);

  useEffect(() => {
    const handleAuthChanged = () => {
      const token = getAuthToken();
      const expiresAt = getAuthExpiresAt();

      if (!token || !expiresAt) {
        stopRefreshTimer();
        return;
      }

      scheduleRefresh();
    };

    window.addEventListener("auth-changed", handleAuthChanged);

    return () => {
      window.removeEventListener("auth-changed", handleAuthChanged);
    };
  }, [scheduleRefresh, stopRefreshTimer]);

  return null;
}

export default SessionExpiryManager;