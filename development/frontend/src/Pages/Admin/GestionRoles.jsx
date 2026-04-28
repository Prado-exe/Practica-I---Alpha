import { useEffect, useState } from "react";
import "../../Styles/Pages_styles/Admin/GestionRoles.css";
import { 
  PlusCircle, 
  Edit3, 
  Trash2, 
  ShieldCheck, 
  Users, 
  Lock,
  ArrowLeft,
  Save
} from "lucide-react";
import CanView from "../../Components/Common/CanView";
import { useAuth } from "../../Context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function GestionRoles() {
  const { user } = useAuth();
  
  // --- ESTADOS DE LISTADO ---
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [permisosDisponibles, setPermisosDisponibles] = useState([]);

  // --- ESTADOS DE NAVEGACIÓN INTERNA ---
  const [isEditing, setIsEditing] = useState(false); // Controla si mostramos el formulario
  const [formData, setFormData] = useState({
    id: null,
    name: "",
    code: "",
    description: "",
    permisos: []
  });

  useEffect(() => {
    if (user?.token) {
      fetchRoles();
      fetchPermisosDisponibles();
    }
  }, [user?.token]);

  // --- PETICIONES API ---
  const fetchRoles = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const fetchPermisosDisponibles = async () => {
    try {
      const res = await fetch(`${API_URL}/api/permisos`, {
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPermisosDisponibles(data.permisos || []);
      }
    } catch (error) {
      console.error("Error obteniendo permisos:", error);
    }
  };

  // --- LÓGICA DE FORMULARIO ---
  const abrirFormulario = (rol = null) => {
    if (rol) {
      // Modo Edición
      setFormData({
        id: rol.role_id,
        name: rol.name,
        code: rol.code,
        description: rol.description || "",
        permisos: rol.permisos_ids || []
      });
    } else {
      // Modo Creación
      setFormData({ id: null, name: "", code: "", description: "", permisos: [] });
    }
    setIsEditing(true);
  };

  const handleCheckboxChange = (permisoId) => {
    setFormData((prev) => {
      const tienePermiso = prev.permisos.includes(permisoId);
      return {
        ...prev,
        permisos: tienePermiso 
          ? prev.permisos.filter(id => id !== permisoId) 
          : [...prev.permisos, permisoId]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.permisos.length === 0) {
      alert("Debes seleccionar al menos un permiso.");
      return;
    }
    const modoEdicion = !!formData.id;
    const url = modoEdicion ? `${API_URL}/api/roles/${formData.id}` : `${API_URL}/api/roles`;
    const method = modoEdicion ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsEditing(false);
        fetchRoles();
      }
    } catch (error) {
      console.error("Error al guardar rol:", error);
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

  // --- VISTA 1: FORMULARIO (NUEVO / EDITAR) ---
  if (isEditing) {
    return (
      <div className="groles-container">
        <div className="groles-header">
          <div className="groles-header-info">
            <button className="btn-back-link" onClick={() => setIsEditing(false)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', color: '#1a6bf0', cursor: 'pointer', padding: 0, marginBottom: '10px', fontWeight: '600' }}>
              <ArrowLeft size={16} /> Volver a la gestión
            </button>
            <h1>{formData.id ? `Editando Rol: ${formData.name}` : "Crear Nuevo Rol"}</h1>
            <p>Configura los permisos y el código identificador del nivel de acceso.</p>
          </div>
        </div>

        <div className="groles-table-wrapper" style={{ padding: '30px' }}>
          <form onSubmit={handleSubmit} className="groles-modal-form" style={{ padding: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="groles-input-group">
                <label>Nombre del Rol</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  required 
                  placeholder="Ej: Editor de Contenidos" 
                />
              </div>
              <div className="groles-input-group">
                <label>Código Identificador</label>
                <input 
                  type="text" 
                  value={formData.code} 
                  onChange={e => setFormData({...formData, code: e.target.value.toLowerCase().replace(/\s+/g, '_')})} 
                  required 
                  placeholder="Ej: editor_cont" 
                  disabled={!!formData.id}
                />
              </div>
            </div>

            <div className="groles-input-group">
              <label>Descripción</label>
              <textarea 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
                required 
                placeholder="Explica qué funciones cumple este rol..."
                style={{ minHeight: '80px' }}
              />
            </div>

            <div className="groles-permissions-section">
              <label style={{ fontWeight: '600', marginBottom: '10px', display: 'block' }}>
                Asignar Permisos ({formData.permisos.length})
              </label>
              <div className="groles-permissions-grid" style={{ maxHeight: 'none', gridTemplateColumns: '1fr 1fr 1fr' }}>
                {permisosDisponibles.map(permiso => (
                  <label key={permiso.permission_id} className="groles-checkbox-item">
                    <input 
                      type="checkbox" 
                      checked={formData.permisos.includes(permiso.permission_id)}
                      onChange={() => handleCheckboxChange(permiso.permission_id)}
                    />
                    <span>{permiso.description || permiso.code}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="groles-modal-actions">
              <button type="button" className="btn-cancelar" onClick={() => setIsEditing(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn-guardar" disabled={formData.permisos.length === 0}>
                <Save size={18} style={{marginRight: '8px'}} />
                {formData.id ? "Actualizar Rol" : "Crear Rol"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // --- VISTA 2: LISTADO PRINCIPAL ---
  return (
    <div className="groles-container">
      <div className="groles-header">
        <div className="groles-header-info">
          <h1>Gestión de Roles</h1>
          <p>Define niveles de acceso y permisos para los usuarios del sistema.</p>
        </div>
        <CanView requiredPermission="roles_permissions.write">
          <button className="groles-btn-create" onClick={() => abrirFormulario()}>
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
            {loading ? (
              <tr><td colSpan="4" style={{textAlign: 'center', padding: '30px'}}>Cargando roles...</td></tr>
            ) : roles.map((rol) => {
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
                            onClick={() => abrirFormulario(rol)} 
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