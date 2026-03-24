import { useAuth } from "../../Context/AuthContext";

function CanView({ requiredPermission, children }) {
  const { user } = useAuth();
  
  // 1. Si no hay usuario logueado, ocultamos
  if (!user) return null;

  // 2. Si no se exige un permiso específico, renderizamos normalmente
  if (!requiredPermission) {
    return children;
  }

  // 3. ✨ PODER ABSOLUTO: Si el usuario es Super Admin, ve todo por defecto
  if (user.role === "super_admin" || user.role_code === "super_admin") {
    return children;
  }

  // 4. Extraemos los permisos correctamente de la RAÍZ del objeto
  const userPermissions = user.permissions || [];

  // 5. Si el usuario no tiene el permiso en su arreglo, ocultamos el elemento
  if (!userPermissions.includes(requiredPermission)) {
    return null;
  }

  // 6. Si tiene el permiso (o es superadmin), dibujamos el contenido original
  return children;
}

export default CanView;