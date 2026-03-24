import { Navigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";

function ProtectedRoute({ children, requiredPermission }) {
  // Extraemos "loading" para que no parpadee al presionar F5
  const { user, loading } = useAuth();

  // 1. Mientras recupera la sesión al recargar la página
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "50px" }}>
        <p>Verificando permisos...</p>
      </div>
    );
  }

  // 2. Si no hay usuario logueado en absoluto
  if (!user || !user.token) {
    return <Navigate to="/login" replace />;
  }

  // 3. Verificación de Permisos Dinámicos (Estilo OWASP)
  if (requiredPermission) {

    console.log("🔍 [ProtectedRoute] Evaluando acceso...");
    console.log("👉 1. Permiso que pide la ruta:", requiredPermission);
    console.log("👉 2. Objeto 'user' completo que llegó al Contexto:", user);
    const userPermissions = user.permissions || [];

    console.log("👉 3. Permisos extraídos (Array final):", userPermissions);
    console.log("👉 4. ¿Pasa la prueba del includes?:", userPermissions.includes(requiredPermission));
    

    if (!userPermissions.includes(requiredPermission)) {
      console.warn(
        `Acceso bloqueado: Se requiere el permiso '${requiredPermission}'. Permisos actuales del usuario:`, 
        userPermissions
      );
      // Si no tiene el permiso, lo devolvemos al inicio
      return <Navigate to="/" replace />;
    }
  }

  // 4. Si pasa todas las pruebas, renderizamos el componente
  return children;
}

export default ProtectedRoute;