import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaUser } from "react-icons/fa";

import "../../styles/ComponentStyle/Navbar/UserDropdown.css";

function UserDropdown({ user, logout }) {
  if (!user) return null;
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef();

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside); 

    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="user-dropdown" ref={dropdownRef}>
      
      {/* BOTÓN USUARIO */}
      <button
        className="user-btn"
        onClick={() => setOpen(!open)}
      >
        <FaUser />
        <span>{user.name}</span>
      </button>

      {/* MENÚ DESPLEGABLE */}
      {open && (
        <div className="user-dropdown-menu">
          {/* 👇 NUEVO ENLACE AÑADIDO AQUÍ 👇 */}
          <Link to="/administracion/proponer-dataset" onClick={() => setOpen(false)}>Proponer Dataset</Link>
          
          <Link to="/administracion" onClick={() => setOpen(false)}>Panel Admin</Link>
          <Link to="/administracion/datasets" onClick={() => setOpen(false)}>Gestion de Datasets</Link>
          <Link to="/administracion/configuracion" onClick={() => setOpen(false)}>Configuración</Link>
          <Link to="/administracion/publicaciones" onClick={() => setOpen(false)}>Publicaciones</Link>
          <Link to="/administracion/usuarios" onClick={() => setOpen(false)}>Usuarios</Link>
          <Link to="/administracion/roles" onClick={() => setOpen(false)}>Roles</Link>
          <Link to="/administracion/instituciones" onClick={()=> setOpen(false)}>Instituciones</Link> 
    
          <button onClick={logout} className="logout">
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

export default UserDropdown;