import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import "../../Styles/ComponentStyle/Admin/Sidebar.css";

// 👇 1. Importamos las herramientas reales de seguridad
import { useAuth } from "../../Context/AuthContext";
import CanView from "../Common/CanView"; 

function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  // 👇 2. Obtenemos el usuario real y la función de logout del contexto
  const { user: authUser, logout } = useAuth();

  // Dependiendo de tu AuthContext, los datos pueden estar en authUser.user o authUser.account
  const userName = authUser?.user?.full_name || authUser?.account?.full_name || "Usuario";
  const userRole = authUser?.user?.role || authUser?.account?.role || "Sin Rol";

  // 👇 3. Agregamos el "requiredPermission" a cada opción del menú
  const menu = [
    // El Dashboard no tiene requiredPermission, por lo que CanView lo dejará pasar siempre
    { name: "Dashboard", path: "/administracion", icon: "📊" }, 
    
    { name: "Datasets", path: "/administracion/datasets", icon: "📁", requiredPermission: "data_management.read" },
    { name: "Publicaciones", path: "/administracion/publicaciones", icon: "📰", requiredPermission: "catalog.write" },
    { name: "Usuarios", path: "/administracion/usuarios", icon: "👥", requiredPermission: "user_management.read" },
    { name: "Roles", path: "/administracion/roles", icon: "🔐", requiredPermission: "roles_permissions.read" },
    { name: "Instituciones", path: "/administracion/instituciones", icon: "🏢", requiredPermission: "admin_general.manage" },
    { name: "Configuración", path: "/administracion/configuracion", icon: "⚙️", requiredPermission: "admin_general.manage" }
  ];

  const isActive = (path) => {
    if (path === "/administracion") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      
      {/* HEADER */}
      <div className="sidebar-header">
        <h2>{collapsed ? "ADM" : "Administración"}</h2>
        <button onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar">
          ☰
        </button>
      </div>

      {/* USUARIO REAL */}
      <div className="sidebar-user">
        <div className="avatar">{userName.charAt(0).toUpperCase()}</div>
        {!collapsed && (
          <div className="user-info">
            <span className="name">{userName}</span>
            <span className="role">{userRole.replace("_", " ")}</span>
          </div>
        )}
      </div>

      {/* NAV CON PERMISOS */}
      <nav className="sidebar-nav">
        {menu.map((item) => (
          /* 👇 4. Envolvemos cada iteración con CanView. La key se pone aquí */
          <CanView key={item.path} requiredPermission={item.requiredPermission}>
            <Link
              to={item.path}
              className={`sidebar-link ${isActive(item.path) ? "active" : ""}`}
            >
              <span className="icon">{item.icon}</span>
              {!collapsed && <span>{item.name}</span>}
            </Link>
          </CanView>
        ))}
      </nav>

      {/* ESPACIADOR */}
      <div className="sidebar-spacer" />

      {/* LOGOUT REAL */}
      <button className="sidebar-logout" onClick={logout}>
        <span className="icon">🚪</span>
        {!collapsed && <span>Salir</span>}
      </button>

    </aside>
  );
}

export default Sidebar;