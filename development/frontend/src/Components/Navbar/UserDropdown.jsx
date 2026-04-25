import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaUser } from "react-icons/fa";
import "../../styles/ComponentStyle/Navbar/UserDropdown.css";

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

  // Definición de roles basada en tus códigos de BD
  const role = user.role_code || user.role; 
  const isSuperAdmin = role === 'super_admin';
  const isDataAdmin = role === 'data_admin';
  const isUserAdmin = role === 'user_admin';
  
  // Condición: ¿Es algún tipo de administrador?
  const isAdminAny = isSuperAdmin || isDataAdmin || isUserAdmin;

  return (
    <div className="user-dropdown" ref={dropdownRef}>
      <button className="user-btn" onClick={() => setOpen(!open)}>
        {children}
      </button>

      {open && (
        <div className="user-dropdown-menu">
          
          {/* SOLUCIÓN: Solo mostramos "Proponer Dataset" si NO es registered_user 
             (Es decir, si es cualquier tipo de Admin)
          */}
          {/* SOLUCIÓN: Solo los administradores de DATOS pueden proponer datasets */}
          {(isDataAdmin || isSuperAdmin) && (
            <Link to="/administracion/proponer-dataset" onClick={() => setOpen(false)}>
              Proponer Dataset
            </Link>
          )}

          {/* Gestión de Datos (Data Admin y Super Admin) */}
          {(isDataAdmin || isSuperAdmin) && (
            <>
              <div className="dropdown-divider"></div>
              <Link to="/administracion" onClick={() => setOpen(false)}>Panel Admin</Link>
              <Link to="/administracion/datasets" onClick={() => setOpen(false)}>Gestión de Datasets</Link>
              <Link to="/administracion/publicaciones" onClick={() => setOpen(false)}>Publicaciones</Link>
            </>
          )}

          {/* Gestión de Usuarios y Seguridad (User Admin y Super Admin) */}
          {(isUserAdmin || isSuperAdmin) && (
            <>
              <div className="dropdown-divider"></div>
              <Link to="/administracion/usuarios" onClick={() => setOpen(false)}>Usuarios</Link>
              <Link to="/administracion/roles" onClick={() => setOpen(false)}>Roles</Link>
            </>
          )}

          {/* Configuración (Solo Super Admin) */}
          {isSuperAdmin && (
            <>
              <Link to="/administracion/instituciones" onClick={() => setOpen(false)}>Instituciones</Link>
              <Link to="/administracion/configuracion" onClick={() => setOpen(false)}>Configuración</Link>
            </>
          )}

          <div className="dropdown-divider"></div>
          <button onClick={logout} className="logout">
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

export default UserDropdown;