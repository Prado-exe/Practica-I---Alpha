import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FaTachometerAlt,
  FaPlus,
  FaDatabase,
  FaNewspaper,
  FaUsers,
  FaKey,
  FaBuilding,
  FaEnvelope,
  FaTags,
  FaSignOutAlt,
  FaChevronDown,
} from "react-icons/fa";
import "../../styles/ComponentStyle/Navbar/UserDropdown.css";

const ROLE_LABELS = {
  super_admin: "Super Administrador",
  data_admin: "Administrador de Datos",
  user_admin: "Administrador de Usuarios",
  registered_user: "Usuario Registrado",
};

function UserDropdown({ user, logout, children }) {
  if (!user) return null;

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const perms = user.permissions || [];
  const has = (p) => perms.includes(p);
  const hasAnyAdmin = perms.length > 0;

  const close = () => setOpen(false);

  const roleLabel = ROLE_LABELS[user.role_code || user.role] || "Usuario";
  const initial = user.full_name?.charAt(0).toUpperCase() || "U";

  return (
    <div className="user-dropdown" ref={dropdownRef}>
      <button className="user-btn" onClick={() => setOpen(!open)}>
        {children}
        <FaChevronDown className={`ud-chevron ${open ? "ud-chevron--open" : ""}`} />
      </button>

      {open && (
        <div className="user-dropdown-menu">

          {/* Header del perfil */}
          <div className="ud-header">
            <div className="ud-avatar">{initial}</div>
            <div className="ud-info">
              <span className="ud-name">{user.full_name || "Usuario"}</span>
              <span className="ud-role">{roleLabel}</span>
            </div>
          </div>

          {/* Panel Admin */}
          {hasAnyAdmin && (
            <>
              <div className="ud-divider" />
              <Link to="/administracion" className="ud-item" onClick={close}>
                <FaTachometerAlt className="ud-icon" />
                Panel Admin
              </Link>
            </>
          )}

          {/* Datos */}
          {(has("data_management.write") || has("data_management.read")) && (
            <>
              <div className="ud-divider ud-divider--labeled"><span>Datos</span></div>
              {has("data_management.write") && (
                <Link to="/administracion/proponer-dataset" className="ud-item" onClick={close}>
                  <FaPlus className="ud-icon" />
                  Proponer Dataset
                </Link>
              )}
              {has("data_management.read") && (
                <Link to="/administracion/datasets" className="ud-item" onClick={close}>
                  <FaDatabase className="ud-icon" />
                  Gestión de Datasets
                </Link>
              )}
            </>
          )}

          {/* Catálogo */}
          {has("catalog.write") && (
            <>
              <div className="ud-divider ud-divider--labeled"><span>Catálogo</span></div>
              <Link to="/administracion/contenido" className="ud-item" onClick={close}>
                <FaNewspaper className="ud-icon" />
                Noticias
              </Link>
            </>
          )}

          {/* Usuarios y Roles */}
          {(has("user_management.read") || has("roles_permissions.read")) && (
            <>
              <div className="ud-divider ud-divider--labeled"><span>Gestión</span></div>
              {has("user_management.read") && (
                <Link to="/administracion/usuarios" className="ud-item" onClick={close}>
                  <FaUsers className="ud-icon" />
                  Usuarios
                </Link>
              )}
              {has("roles_permissions.read") && (
                <Link to="/administracion/roles" className="ud-item" onClick={close}>
                  <FaKey className="ud-icon" />
                  Roles
                </Link>
              )}
            </>
          )}

          {/* Administración general */}
          {has("admin_general.manage") && (
            <>
              <div className="ud-divider ud-divider--labeled"><span>Sistema</span></div>
              <Link to="/administracion/instituciones" className="ud-item" onClick={close}>
                <FaBuilding className="ud-icon" />
                Instituciones
              </Link>
              <Link to="/administracion/contacto" className="ud-item" onClick={close}>
                <FaEnvelope className="ud-icon" />
                Contacto
              </Link>
              <Link to="/administracion/etiquetas" className="ud-item" onClick={close}>
                <FaTags className="ud-icon" />
                Etiquetas
              </Link>
            </>
          )}

          {/* Cerrar sesión */}
          <div className="ud-divider" />
          <button onClick={logout} className="ud-item ud-logout">
            <FaSignOutAlt className="ud-icon" />
            Cerrar sesión
          </button>

        </div>
      )}
    </div>
  );
}

export default UserDropdown;
