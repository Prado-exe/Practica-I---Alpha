import { useEffect, useState } from "react";
import "../../Styles/Pages_styles/Admin/GestionRoles.css";
import CanView from "../../Components/Common/CanView";

function GestionRoles() {

  const [roles, setRoles] = useState([]);

  useEffect(() => {
    // Simulación de datos (luego reemplazas por fetch)
    setRoles([
      { id: 1, nombre: "Administrador", nivel: 10, usuarios: 3 },
      { id: 2, nombre: "Editor", nivel: 5, usuarios: 8 },
      { id: 3, nombre: "Usuario", nivel: 1, usuarios: 20 },
    ]);
  }, []);

  const handleEditar = (id) => {
    console.log("Editar rol:", id);
  };

  const handleEliminar = (id) => {
    console.log("Eliminar rol:", id);
  };

  return (
    <div className="gestion-roles">

      <div className="roles-header">
        <h1>Gestión de Roles</h1>
        <CanView requiredPermission="roles_permissions.write">
          <button className="btn-crear">+ Crear Rol</button>
        </CanView>
      </div>

      <div className="roles-tabla">

        <div className="roles-fila roles-cabecera">
          <span>Nombre</span>
          <span>Nivel</span>
          <span>Usuarios</span>
          <span>Acciones</span>
        </div>

        {roles.map((rol) => (
          <div key={rol.id} className="roles-fila">
            <span>{rol.nombre}</span>
            <span>{rol.nivel}</span>
            <span>{rol.usuarios}</span>

            <div className="acciones">
              <CanView requiredPermission="roles_permissions.write">
                <button onClick={() => handleEditar(rol.id)}>Editar</button>
                <button onClick={() => handleEliminar(rol.id)} className="eliminar">
                  Eliminar
                </button>
              </CanView>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GestionRoles;