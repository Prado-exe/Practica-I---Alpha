import { useAuth } from "../../Context/AuthContext";

function CanView({ requiredPermission, children }) {
  const { user } = useAuth();
  
  // Extraemos los permisos basándonos en tu AuthContext
  const userPermissions = user?.user?.permissions || [];

  // Si no se exige un permiso específico, renderizamos normalmente
  if (!requiredPermission) {
    return children;
  }

  // Si el usuario no tiene el permiso en su arreglo, devolvemos null (oculta el elemento)
  if (!userPermissions.includes(requiredPermission)) {
    return null;
  }

  // Si tiene el permiso, dibujamos el contenido original
  return children;
}

export default CanView;