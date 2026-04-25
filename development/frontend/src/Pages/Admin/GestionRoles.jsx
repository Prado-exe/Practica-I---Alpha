import { useEffect, useState } from "react";
import "../../Styles/Pages_styles/Admin/GestionRoles.css";
import CanView from "../../Components/Common/CanView";
import { useAuth } from "../../Context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://3.139.202.192:3000";

function GestionRoles() {
  const { user } = useAuth();
  const [roles, setRoles] = useState([]);
  const [permisosDisponibles, setPermisosDisponibles] = useState([]);
  
  // Estados para el Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    name: "",
    code: "",
    description: "",
    permisos: [] // Array de IDs de permisos seleccionados
  });

  useEffect(() => {
    if (user?.token) {
      fetchRoles();
      fetchPermisosDisponibles();
    }
  }, [user?.token]);

  // 1. Obtener Roles (Asumimos que el backend enviará cantidad de permisos y usuarios)
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

  // 2. Obtener la lista maestra de Permisos para las casillas
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

  // 3. Abrir Modal para CREAR
  const abrirModalCrear = () => {
    setModoEdicion(false);
    setFormData({ id: null, name: "", code: "", description: "", permisos: [] });
    setModalOpen(true);
  };

  // 4. Abrir Modal para EDITAR
  const abrirModalEditar = (rol) => {
    setModoEdicion(true);
    setFormData({
      id: rol.role_id,
      name: rol.name,
      code: rol.code,
      description: rol.description || "",
      permisos: rol.permisos_ids || [] // El backend debe enviarnos qué permisos ya tiene
    });
    setModalOpen(true);
  };

  // 5. Manejar cambio en los Checkboxes de permisos
  const handleCheckboxChange = (permisoId) => {
    setFormData((prev) => {
      const tienePermiso = prev.permisos.includes(permisoId);
      if (tienePermiso) {
        return { ...prev, permisos: prev.permisos.filter(id => id !== permisoId) };
      } else {
        return { ...prev, permisos: [...prev.permisos, permisoId] };
      }
    });
  };

  // 6. Enviar Formulario (Crear o Editar)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.permisos.length === 0) {
      alert("Debes seleccionar al menos un permiso para este rol.");
      return;
    }

    const url = modoEdicion 
      ? `${API_URL}/api/roles/${formData.id}` 
      : `${API_URL}/api/roles`;
    
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
        alert(`Rol ${modoEdicion ? "actualizado" : "creado"} correctamente`);
        setModalOpen(false);
        fetchRoles(); // Recargar la tabla
      } else {
        const err = await res.json();
        alert(`Error: ${err.message}`);
      }
    } catch (error) {
      console.error("Error al guardar rol:", error);
    }
  };

  // 7. Eliminar Rol
  const handleEliminar = async (rol) => {
    if (window.confirm(`⚠️ ¿Estás seguro de eliminar el rol "${rol.name}"? Los ${rol.cantidad_usuarios} usuarios con este rol pasarán a ser "Usuario Registrado".`)) {
      try {
        const res = await fetch(`${API_URL}/api/roles/${rol.role_id}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${user.token}` }
        });

        if (res.ok) {
          alert("Rol eliminado. Usuarios reasignados.");
          fetchRoles();
        } else {
          const err = await res.json();
          alert(`Error: ${err.message}`);
        }
      } catch (error) {
        console.error("Error eliminando rol:", error);
      }
    }
  };

  return (
    <div className="gestion-roles">
      <div className="roles-header">
        <h1>Gestión de Roles</h1>
        <CanView requiredPermission="roles_permissions.write">
          <button className="btn-crear" onClick={abrirModalCrear}>+ Crear Rol</button>
        </CanView>
      </div>

      <div className="roles-tabla">
        <div className="roles-fila roles-cabecera">
          <span>Nombre</span>
          <span>Permisos</span>
          <span>Usuarios</span>
          <span>Acciones</span>
        </div>

        {roles.map((rol) => {
          
          const rolesProtegidos = ["super_admin", "data_admin", "user_admin", "registered_user"];
          
          // Verificamos si el código del rol actual está dentro de la lista de protegidos
          const esRolProtegido = rolesProtegidos.includes(rol.code);

          return (
            <div key={rol.role_id} className="roles-fila">
              <span>{rol.name} <br/><small style={{color: '#666'}}>{rol.code}</small></span>
              <span>{rol.cantidad_permisos} permisos</span>
              <span>{rol.cantidad_usuarios} usuarios</span>

              <div className="acciones">
                <CanView requiredPermission="roles_permissions.write">
                  
                  {/* 👇 2. Evaluamos: Si NO es protegido, mostramos Editar y Eliminar 👇 */}
                  {!esRolProtegido ? (
                    <>
                      <button onClick={() => abrirModalEditar(rol)}>Editar</button>
                      <button onClick={() => handleEliminar(rol)} className="eliminar">
                        Eliminar
                      </button>
                    </>
                  ) : (
                    /* 👇 3. Si ES protegido, mostramos un único botón gris de solo lectura 👇 */
                    <button disabled style={{ background: "#e0e0e0", color: "#666", cursor: "not-allowed", width: "100%", border: "1px dashed #ccc" }} title="Rol del sistema protegido contra cambios">
                      🔒 Sistema (Protegido)
                    </button>
                  )}

                </CanView>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL DE CREACIÓN / EDICIÓN */}
      {modalOpen && (
        <div className="modal-overlay" style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div className="modal-content" style={{ background: "white", padding: "25px", borderRadius: "8px", width: "500px", maxHeight: "90vh", overflowY: "auto", color: "black" }}>
            <h2>{modoEdicion ? "Editar Rol" : "Crear Nuevo Rol"}</h2>
            
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "15px" }}>
              <label><strong>Nombre del rol:</strong></label>
              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="Ej: Observador de datos" style={{ padding: "8px" }} />
              
              <label><strong>Código del rol (Único):</strong></label>
              <input type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toLowerCase().replace(/\s+/g, '_')})} required placeholder="Ej: data_observer" disabled={modoEdicion && (formData.code === 'super_admin' || formData.code === 'registered_user')} style={{ padding: "8px" }} />

              <label><strong>Descripción:</strong></label>
              <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required placeholder="Breve descripción del propósito de este rol..." style={{ padding: "8px", resize: "vertical", minHeight: "60px" }} />

              <hr style={{ margin: "15px 0" }}/>

              <label><strong>Permisos Asignados ({formData.permisos.length}):</strong></label>
              <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid #ccc", padding: "10px", borderRadius: "4px", display: "flex", flexDirection: "column", gap: "8px" }}>
                {permisosDisponibles.map(permiso => (
                  <label key={permiso.permission_id} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input 
                      type="checkbox" 
                      checked={formData.permisos.includes(permiso.permission_id)}
                      onChange={() => handleCheckboxChange(permiso.permission_id)}
                    />
                    <span>{permiso.description || permiso.code}</span>
                  </label>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
                <button type="button" onClick={() => setModalOpen(false)} style={{ background: "#ccc", padding: "10px 15px", border: "none", borderRadius: "4px", cursor: "pointer" }}>Cancelar</button>
                <button type="submit" disabled={formData.permisos.length === 0} style={{ background: formData.permisos.length === 0 ? "#999" : "#2196F3", color: "white", padding: "10px 15px", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                  {modoEdicion ? "Guardar Cambios" : "Crear Rol"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}

export default GestionRoles;