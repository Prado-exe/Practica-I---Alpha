import { createContext, useContext, useState, useEffect, useRef } from "react";

const AuthContext = createContext();
const API_URL = import.meta.env.VITE_API_URL || "http://3.139.202.192:3000";

export function AuthProvider({ children }) {
  // 1. Inicializamos el estado leyendo el localStorage directamente
  // Así React sabe quién eres INMEDIATAMENTE al recargar, sin esperar a la red.
  const [user, setUser] = useState(() => {
    const storedSession = localStorage.getItem("app_session");
    return storedSession ? JSON.parse(storedSession) : null;
  });
  
  const [loading, setLoading] = useState(true);

  // 2. EL ESCUDO: Esta variable sobrevive a los dobles renderizados de React StrictMode
  const hasFetched = useRef(false);

  useEffect(() => {
    // 3. Si ya hicimos la petición, detenemos la segunda ejecución fantasma
    if (hasFetched.current) return;
    hasFetched.current = true; // Marcamos que ya disparamos la petición

    const checkAuth = async () => {
      try {
        const response = await fetch(`${API_URL}/api/refresh`, {
          method: "POST", 
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include", 
        });

        if (!response.ok && response.status !== 401) {
          throw new Error(`Error del servidor: ${response.status}`);
        }

        const data = await response.json();

        if (response.ok && (data.ok || data.accessToken || data.token)) {
          const tokenValid = data.token || data.accessToken;
          const userAccount = data.account || data.user || {};

          const sessionData = {
            ...userAccount,
            token: tokenValid, 
            expiresAt: data.expiresAt || data.accessExpiresAt
          };

          setUser(sessionData);
          // 4. Si el refresh es exitoso, actualizamos el localStorage con el nuevo token
          localStorage.setItem("app_session", JSON.stringify(sessionData));

        } else {
          if (response.status === 401) {
            setUser(null);
            // 5. Si el refresh falla (ej: sesión expirada legítimamente), limpiamos el disco duro
            localStorage.removeItem("app_session");
          }
        }
      } catch (error) {
        console.error("⚠️ Error de red al recuperar la sesión:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (userData) => {
    setUser(userData);
    // 6. Guardamos en el disco duro cuando el usuario se loguea desde Login.jsx
    localStorage.setItem("app_session", JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/api/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user?.token}` 
        },
        credentials: "include",
      });
    } catch (error) {
      console.error("Error al cerrar sesión en el servidor:", error);
    } finally {
      setUser(null);
      // 7. Borramos del disco duro al cerrar sesión
      localStorage.removeItem("app_session");
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