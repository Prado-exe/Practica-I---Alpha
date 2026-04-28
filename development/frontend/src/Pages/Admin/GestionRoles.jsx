import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Añadido
import "../../Styles/Pages_styles/Admin/GestionRoles.css";
import { 
  PlusCircle, 
  Edit3, 
  Trash2, 
  ShieldCheck, 
  Users, 
  Lock 
} from "lucide-react";
import CanView from "../../Components/Common/CanView";
import { useAuth } from "../../Context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function GestionRoles() {
  const { user } = useAuth();
  const navigate = useNavigate(); // Hook de navegación
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    if (user?.token) {
      fetchRoles();
    }
  }, [user?.token]);

  const fetchRoles = async () => {
    try {
      const res = await fetch(`${API_URL}/api/roles/detalles`, {
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRoles(data.roles || []);
      }
    } catch (error) {
      console.error("Error obteniendo roles:", error);
    }
  };

  const handleEliminar = async (rol) => {
    if (window.confirm(`⚠️ ¿Estás seguro de eliminar el rol "${rol.name}"?`)) {
      try {
        const res = await fetch(`${API_URL}/api/roles/${rol.role_id}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${user.token}` }
        });
        if (res.ok) fetchRoles();
      } catch (error) {
        console.error("Error eliminando rol:", error);
      }
    }
  };

  return (
    <div className="groles-container">
      <div className="groles-header">
        <div className="groles-header-info">
          <h1>Gestión de Roles</h1>
          <p>Define niveles de acceso y permisos para los usuarios del sistema.</p>
        </div>
        <CanView requiredPermission="roles_permissions.write">
          {/* Navegamos a la nueva ruta */}
          <button className="groles-btn-create" onClick={() => navigate("/admin/roles/nuevo")}>
            <PlusCircle size={18} /> Crear Rol
          </button>
        </CanView>
      </div>

      <div className="groles-table-wrapper">
        <table className="groles-table">
          <thead>
            <tr>
              <th>Nombre del Rol</th>
              <th style={{ textAlign: 'center' }}>Permisos</th>
              <th style={{ textAlign: 'center' }}>Usuarios</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((rol) => {
              const rolesProtegidos = ["super_admin", "data_admin", "user_admin", "registered_user"];
              const esRolProtegido = rolesProtegidos.includes(rol.code);

              return (
                <tr key={rol.role_id}>
                  <td>
                    <div className="groles-role-info">
                      <strong>{rol.name}</strong>
                      <span>{rol.code}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="groles-badge badge-permisos">
                      <ShieldCheck size={14} /> {rol.cantidad_permisos}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="groles-badge badge-users">
                      <Users size={14} /> {rol.cantidad_usuarios}
                    </span>
                  </td>
                  <td className="groles-actions">
                    <CanView requiredPermission="roles_permissions.write">
                      {!esRolProtegido ? (
                        <>
                          <Edit3 
                            className="groles-action-icon edit" 
                            size={20} 
                            onClick={() => navigate(`/admin/roles/editar/${rol.role_id}`)} 
                            title="Editar Rol"
                          />
                          <Trash2 
                            className="groles-action-icon delete" 
                            size={20} 
                            onClick={() => handleEliminar(rol)} 
                            title="Eliminar Rol"
                          />
                        </>
                      ) : (
                        <div className="groles-locked" title="Rol del sistema protegido">
                          <Lock size={18} />
                          <span>Sistema</span>
                        </div>
                      )}
                    </CanView>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default GestionRoles;