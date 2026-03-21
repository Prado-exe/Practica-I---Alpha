import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import "../../Styles/ComponentStyle/Admin/Sidebar.css"

function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const user = {
    name: "Admin",
    role: "Administrador"
  };

  const menu = [
    { name: "Dashboard", path: "/administracion", icon: "📊" },
    { name: "Datasets", path: "/administracion/datasets", icon: "📁" },
    { name: "Publicaciones", path: "/administracion/publicaciones", icon: "📰" },
    { name: "Usuarios", path: "/administracion/usuarios", icon: "👥" },
    { name: "Roles", path: "/administracion/roles", icon: "🔐" },
    { name: "Instituciones", path: "/administracion/instituciones", icon: "🏢" },
    { name: "Configuración", path: "/administracion/configuracion", icon: "⚙️" }
  ];

  const isActive = (path) => {
    if (path === "/administracion") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    console.log("Cerrar sesión");
    // aquí luego conectas con auth
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

      {/* USUARIO */}
      <div className="sidebar-user">
        <div className="avatar">{user.name.charAt(0)}</div>
        {!collapsed && (
          <div className="user-info">
            <span className="name">{user.name}</span>
            <span className="role">{user.role}</span>
          </div>
        )}
      </div>

      {/* NAV */}
      <nav className="sidebar-nav">
        {menu.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`sidebar-link ${isActive(item.path) ? "active" : ""}`}
          >
            <span className="icon">{item.icon}</span>
            {!collapsed && <span>{item.name}</span>}
          </Link>
        ))}
      </nav>

      {/* ESPACIADOR */}
      <div className="sidebar-spacer" />

      {/* LOGOUT */}
      <button className="sidebar-logout" onClick={handleLogout}>
        <span className="icon">🚪</span>
        {!collapsed && <span>Salir</span>}
      </button>

    </aside>
  );
}

export default Sidebar;