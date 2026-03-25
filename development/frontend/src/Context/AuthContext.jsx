import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${API_URL}/api/refresh`, {
          method: "POST", 
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include", 
        });

        // Si el backend falla catastróficamente, no intentamos parsear JSON
        if (!response.ok && response.status !== 401) {
          throw new Error(`Error del servidor: ${response.status}`);
        }

        const data = await response.json();

        if (response.ok && (data.ok || data.accessToken || data.token)) {
          const tokenValid = data.token || data.accessToken;
          const userAccount = data.account || data.user || {};

          setUser({
            ...userAccount,
            token: tokenValid, 
            expiresAt: data.expiresAt || data.accessExpiresAt
          });
        } else {
          // Solo borramos el usuario si el backend confirma que expiró (401)
          if (response.status === 401) {
            setUser(null);
          }
        }
      } catch (error) {
        console.error("⚠️ Error de red al recuperar la sesión:", error);
        // 🛡️ IMPORTANTE: NO hacemos setUser(null) aquí.
        // Si el backend se reinicia, mantenemos la sesión en memoria.
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // 👇 FUNCIÓN LOGIN CORREGIDA
  // Como Login.jsx ya nos entrega el usuario listo, solo lo guardamos
  const login = (userData) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/api/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Error al cerrar sesión en el servidor:", error);
    } finally {
      setUser(null);
      window.dispatchEvent(new Event("auth-changed"));
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}