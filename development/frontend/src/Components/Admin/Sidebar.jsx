import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { 
  LayoutDashboard, 
  Database, 
  Newspaper, 
  Users, 
  ShieldCheck, 
  Building2, 
  Settings, 
  Menu, 
  LogOut 
} from "lucide-react";
import "../../Styles/ComponentStyle/Admin/Sidebar.css";

// Importamos las herramientas reales de seguridad
import { useAuth } from "../../Context/AuthContext";
import CanView from "../Common/CanView"; 

function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  // Obtenemos el usuario real y la función de logout del contexto
  const { user: authUser, logout } = useAuth();

  const userName = authUser?.full_name || "Usuario";
  const userRole = authUser?.role || "Sin Rol";

  // Reemplazamos los emojis por componentes de iconos
  const menu = [
    { name: "Dashboard", path: "/administracion", icon: LayoutDashboard }, 
    { name: "Datasets", path: "/administracion/datasets", icon: Database, requiredPermission: "data_management.read" },
    { name: "Publicaciones", path: "/administracion/publicaciones", icon: Newspaper, requiredPermission: "catalog.write" },
    { name: "Noticias", path: "/administracion/noticias", icon: "📰", requiredPermission: "catalog.write" },
    { name: "Usuarios", path: "/administracion/usuarios", icon: Users, requiredPermission: "user_management.read" },
    { name: "Roles", path: "/administracion/roles", icon: ShieldCheck, requiredPermission: "roles_permissions.read" },
    { name: "Instituciones", path: "/administracion/instituciones", icon: Building2, requiredPermission: "admin_general.manage" },
    { name: "Etiquetas", path: "/administracion/etiquetas", icon: "🏷️", requiredPermission: "admin_general.manage" },
    { name: "Configuración", path: "/administracion/configuracion", icon: Settings, requiredPermission: "admin_general.manage" },
    
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
        <div className="brand">
          <div className="brand-logo">AD</div>
          {!collapsed && <h2>Administración</h2>}
        </div>
        <button onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar" className="toggle-btn">
          <Menu size={20} />
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
        {menu.map((item) => {
          const IconComponent = item.icon;
          return (
            <CanView key={item.path} requiredPermission={item.requiredPermission}>
              <Link
                to={item.path}
                className={`sidebar-link ${isActive(item.path) ? "active" : ""}`}
                title={collapsed ? item.name : ""} // Muestra tooltip nativo si está colapsado
              >
                <div className="icon">
                  <IconComponent size={20} strokeWidth={isActive(item.path) ? 2.5 : 2} />
                </div>
                {!collapsed && <span>{item.name}</span>}
              </Link>
            </CanView>
          );
        })}
      </nav>

      {/* ESPACIADOR */}
      <div className="sidebar-spacer" />

      {/* LOGOUT REAL */}
      <button className="sidebar-logout" onClick={logout} title={collapsed ? "Salir" : ""}>
        <div className="icon">
          <LogOut size={20} />
        </div>
        {!collapsed && <span>Cerrar Sesión</span>}
      </button>

    </aside>
  );
}

export default Sidebar;