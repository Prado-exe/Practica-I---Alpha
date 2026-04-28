import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  Save, 
  ArrowLeft, 
  ShieldCheck, 
  Info 
} from "lucide-react";
import { useAuth } from "../../Context/AuthContext";
import "../../Styles/Pages_styles/Admin/GestionRoles.css"; // Reutilizamos estilos o creamos uno nuevo

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function NuevoRol() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams(); // Si existe ID, estamos editando
  
  const [permisosDisponibles, setPermisosDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    permisos: []
  });

  const modoEdicion = !!id;

  useEffect(() => {
    if (user?.token) {
      initPage();
    }
  }, [user?.token, id]);

  const initPage = async () => {
    setLoading(true);
    await fetchPermisosDisponibles();
    if (modoEdicion) {
      await fetchRolParaEditar();
    }
    setLoading(false);
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

  const fetchRolParaEditar = async () => {
    try {
      // Usamos el endpoint de detalles para traer permisos_ids
      const res = await fetch(`${API_URL}/api/roles/detalles`, {
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const rol = data.roles.find(r => r.role_id === parseInt(id));
        if (rol) {
          setFormData({
            name: rol.name,
            code: rol.code,
            description: rol.description || "",
            permisos: rol.permisos_ids || []
          });
        }
      }
    } catch (error) {
      console.error("Error al cargar rol:", error);
    }
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

    const url = modoEdicion ? `${API_URL}/api/roles/${id}` : `${API_URL}/api/roles`;
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
        navigate("/admin/roles"); // Volver a la lista
      }
    } catch (error) {
      console.error("Error al guardar:", error);
    }
  };

  if (loading) return <div className="groles-container">Cargando...</div>;

  return (
    <div className="groles-container">
      <div className="groles-header">
        <div className="groles-header-info">
          <button className="btn-back-link" onClick={() => navigate("/admin/roles")} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', color: '#1a6bf0', cursor: 'pointer', padding: 0, marginBottom: '10px', fontWeight: '600' }}>
            <ArrowLeft size={16} /> Volver a la gestión
          </button>
          <h1>{modoEdicion ? `Editando Rol: ${formData.name}` : "Crear Nuevo Rol"}</h1>
          <p>Configura las capacidades y el identificador único del rol.</p>
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
                disabled={modoEdicion}
              />
            </div>
          </div>

          <div className="groles-input-group">
            <label>Descripción</label>
            <textarea 
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})} 
              required 
              style={{ minHeight: '100px' }}
              placeholder="Explica qué funciones cumple este rol..."
            />
          </div>

          <div className="groles-permissions-section">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontWeight: '600', color: '#4a5568' }}>
              <ShieldCheck size={18} /> Asignar Permisos ({formData.permisos.length})
            </label>
            <div className="groles-permissions-grid" style={{ maxIdHeight: 'none', gridTemplateColumns: '1fr 1fr 1fr' }}>
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
            <button type="button" className="btn-cancelar" onClick={() => navigate("/admin/roles")}>
              Descartar
            </button>
            <button type="submit" className="btn-guardar" disabled={formData.permisos.length === 0}>
              <Save size={18} style={{ marginRight: '8px' }} />
              {modoEdicion ? "Guardar Cambios" : "Crear Rol"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NuevoRol;