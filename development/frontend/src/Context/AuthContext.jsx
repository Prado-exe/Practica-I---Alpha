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

        const data = await response.json();

        if (response.ok && (data.ok || data.accessToken || data.token)) {
          // 🛡️ Búsqueda inteligente: buscamos 'token' o 'accessToken'
          const tokenValid = data.token || data.accessToken;
          const userAccount = data.account || data.user || {};

          setUser({
            ...userAccount,
            token: tokenValid, 
            expiresAt: data.expiresAt || data.accessExpiresAt
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error al recuperar la sesión:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // 👇 Modificamos la función login para que aplane los datos igual que checkAuth
  const login = (data) => {
    const tokenValid = data.token || data.accessToken;
    const userAccount = data.account || data.user || {};

    setUser({
      ...userAccount,
      token: tokenValid,
      expiresAt: data.expiresAt || data.accessExpiresAt
    });
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