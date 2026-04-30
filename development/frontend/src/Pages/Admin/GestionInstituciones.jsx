import { useEffect, useState } from "react";
import CanView from "../../Components/Common/CanView";
import { useAuth } from "../../Context/AuthContext";
import { 
  Search, 
  Eye, 
  Edit3, 
  Trash2, 
  PlusCircle, 
  RotateCcw
} from "lucide-react";
import CrearInstitucion from "./CrearInstitucion"; 
import EditarInstitucion from "./EditarInstitucion"; 
import FichaInstitucion from "./FichaInstitucion"; // Importamos el nuevo componente
import "../../Styles/Pages_styles/Admin/GestionInstituciones.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function GestionInstituciones() {
  const { user } = useAuth();
  const [instituciones, setInstituciones] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({ busqueda: "", tipo: "", estado: "" });
  const [isCreating, setIsCreating] = useState(false);
  const [editingInstitution, setEditingInstitution] = useState(null); 
  const [viewingInstitution, setViewingInstitution] = useState(null); // Nuevo estado para la ficha

  useEffect(() => {
    if (user?.token) fetchInstituciones();
  }, [user?.token]);

  const fetchInstituciones = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/instituciones`, {
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInstituciones(data.instituciones || []);
      }
    } catch (error) {
      console.error("Error obteniendo instituciones:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id, nombre) => {
    if(!window.confirm(`¿Estás seguro de que deseas eliminar permanentemente a ${nombre}?`)) return;
    try {
      const res = await fetch(`${API_URL}/api/instituciones/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if(res.ok) {
        alert("Institución eliminada con éxito.");
        fetchInstituciones();
      }
    } catch(error) {
      console.error(error);
    }
  };

  const handleChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });
  const handleClear = () => setFilters({ busqueda: "", tipo: "", estado: "" });

  // --- RENDERIZADO CONDICIONAL (IGUAL QUE CREAR Y EDITAR) ---
  if (isCreating) {
    return <CrearInstitucion onCancel={() => { setIsCreating(false); fetchInstituciones(); }} />;
  }

  if (editingInstitution) {
    return <EditarInstitucion 
      institucion={editingInstitution} 
      onCancel={() => { setEditingInstitution(null); fetchInstituciones(); }} 
    />;
  }

  if (viewingInstitution) {
    return <FichaInstitucion 
      institucion={viewingInstitution} 
      onBack={() => setViewingInstitution(null)} 
    />;
  }

  const institucionesFiltradas = instituciones.filter(inst => 
    (inst.legal_name || "").toLowerCase().includes(filters.busqueda.toLowerCase()) &&
    (filters.tipo === "" || inst.institution_type === filters.tipo) &&
    (filters.estado === "" || inst.institution_status === filters.estado)
  );

  return (
    <div className="ginstituciones-container">
      <div className="ginstituciones-header">
        <div className="ginstituciones-header-info">
          <h1>Gestión de Instituciones</h1>
          <p>Administra las entidades responsables y propietarios de los conjuntos de datos.</p>
        </div>
        <CanView requiredPermission="admin_general.manage">
          <button className="ginstituciones-btn-create" onClick={() => setIsCreating(true)}>
            <PlusCircle size={18} /> Nueva Institución
          </button>
        </CanView>
      </div>

      {/* ... (Sección de filtros se mantiene igual) ... */}

      <div className="ginstituciones-table-container">
        <table>
          <thead>
            <tr>
              <th>Nombre Legal</th>
              <th>Sigla</th>
              <th>Tipo de Entidad</th>
              <th style={{ textAlign: 'center' }}>Estado</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>Cargando instituciones...</td></tr>
            ) : institucionesFiltradas.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>No se encontraron instituciones.</td></tr>
            ) : (
              institucionesFiltradas.map((inst) => {
                const isActive = inst.institution_status === 'active';
                const id = inst.institution_id || inst.id;
                return (
                  <tr key={id}>
                    <td>{inst.legal_name}</td>
                    <td><span className="ginstituciones-sigla-tag">{inst.short_name || "-"}</span></td>
                    <td>{inst.institution_type}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`ginstituciones-badge ${isActive ? 'active' : 'inactive'}`}>
                        {isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="ginstituciones-acciones">
                      <Eye 
                        className="ginstituciones-icon-view" 
                        size={20} 
                        title="Ver Ficha" 
                        onClick={() => setViewingInstitution(inst)} // Cambiado para asignar al estado
                      />
                      <Edit3 
                        className="ginstituciones-icon-edit" 
                        size={20} 
                        title="Editar" 
                        onClick={() => setEditingInstitution(inst)} 
                      />
                      <Trash2 
                        className="ginstituciones-icon-delete" 
                        size={20} 
                        title="Eliminar" 
                        onClick={() => handleEliminar(id, inst.legal_name)} 
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default GestionInstituciones;