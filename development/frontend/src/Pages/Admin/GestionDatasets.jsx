import { useState, useEffect } from "react";
import "../../styles/pages_styles/Admin/GestionDatasets.css";
// Cambiamos Fi por Lucide
import { 
  Search, 
  Edit3, 
  Trash2, 
  Eye, 
  PlusCircle, 
  CheckCircle2, 
  EyeOff, 
  AlertCircle,
  RotateCcw
} from "lucide-react"; 
import CanView from "../../Components/Common/CanView";
import CrearDataset from "./CrearDataset";
import EditarDataset from "./EditarDataset"; 
import { useNavigate } from "react-router-dom";
import RevisarDataset from "./RevisarDataset";
import ValidarDataset from "./ValidarDataset";

import { useAuth } from "../../Context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function GestionDatasets() {
  const navigate = useNavigate();
  const { user } = useAuth(); 

  // --- ESTADOS ---
  const [filters, setFilters] = useState({ 
    nombre: "", 
    category_id: "", 
    estado: "", 
    fecha: "", 
    institucion_id: "" 
  });
  
  const [isCreating, setIsCreating] = useState(false);
  const [datasets, setDatasets] = useState([]);
  const [instituciones, setInstituciones] = useState([]);
  const [categorias, setCategorias] = useState([]);
  
  const [reviewingDatasetId, setReviewingDatasetId] = useState(null);
  const [editingDatasetId, setEditingDatasetId] = useState(null);
  const [validatingDatasetId, setValidatingDatasetId] = useState(null);

  // --- CARGA DE DATOS ---
  useEffect(() => {
    if (user?.token) {
      fetchDatasets();
      fetchFilterOptions();
    }
  }, [user?.token]);

  const fetchFilterOptions = async () => {
    try {
      const instRes = await fetch(`${API_URL}/api/instituciones`, {
        headers: { "Authorization": `Bearer ${user?.token}` }
      });
      if (instRes.ok) {
        const data = await instRes.json();
        setInstituciones(data.instituciones || []);
      }

      const catRes = await fetch(`${API_URL}/api/categories`);
      if (catRes.ok) {
        const data = await catRes.json();
        setCategorias(data.data || []);
      }
    } catch (error) {
      console.error("Error cargando opciones de filtro:", error);
    }
  };

  const fetchDatasets = async (appliedFilters = filters) => {
    try {
      const params = new URLSearchParams();
      if (appliedFilters.nombre) params.append("search", appliedFilters.nombre);
      if (appliedFilters.category_id) params.append("categoria", appliedFilters.category_id);
      if (appliedFilters.institucion_id) params.append("institucion", appliedFilters.institucion_id);
      if (appliedFilters.estado) params.append("estado", appliedFilters.estado);
      if (appliedFilters.fecha) params.append("fecha", appliedFilters.fecha);

      const queryString = params.toString();
      const endpoint = `${API_URL}/api/datasets${queryString ? `?${queryString}` : ''}`;

      const res = await fetch(endpoint, {
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setDatasets(data.data || data || []); 
      }
    } catch (error) {
      console.error("Error de red:", error);
    }
  };

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearch = () => {
    fetchDatasets(filters);
  };

  const handleClear = () => {
    const emptyFilters = { nombre: "", category_id: "", estado: "", fecha: "", institucion_id: "" };
    setFilters(emptyFilters);
    fetchDatasets(emptyFilters);
  };

  const handleOcultar = async (id, nombre) => {
    if (!window.confirm(`¿Estás seguro de que deseas ocultar "${nombre}"?\nEl público ya no podrá verlo.`)) return;
    try {
      const res = await fetch(`${API_URL}/api/datasets/${id}/archive`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if (res.ok) { fetchDatasets(); }
    } catch (error) { console.error("Error al ocultar:", error); }
  };
  
  const handleMostrar = async (id, nombre) => {
    if (!window.confirm(`¿Deseas volver a hacer visible "${nombre}"?`)) return;
    try {
      const res = await fetch(`${API_URL}/api/datasets/${id}/unarchive`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if (res.ok) { fetchDatasets(); }
    } catch (error) { console.error("Error al mostrar:", error); }
  };

  const handleDestruir = async (id, nombre) => {
    if (!window.confirm(`⚠️ ADVERTENCIA CRÍTICA ⚠️\n\n¿Estás absolutamente seguro de que deseas DESTRUIR permanentemente "${nombre}"?\n\nESTA ACCIÓN NO SE PUEDE DESHACER.`)) return;
    try {
      const res = await fetch(`${API_URL}/api/datasets/${id}/hard`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if (res.ok) { fetchDatasets(); }
    } catch (error) { console.error("Error al destruir:", error); }
  };

  if (isCreating) return <CrearDataset onCancel={() => { setIsCreating(false); fetchDatasets(); }} />;
  if (reviewingDatasetId) return <RevisarDataset datasetId={reviewingDatasetId} onCancel={() => { setReviewingDatasetId(null); fetchDatasets(); }} />;
  if (editingDatasetId) return <EditarDataset datasetId={editingDatasetId} onCancel={() => { setEditingDatasetId(null); fetchDatasets(); }} />;
  if (validatingDatasetId) return <ValidarDataset datasetId={validatingDatasetId} onCancel={() => { setValidatingDatasetId(null); fetchDatasets(); }} />;

  return (
    <div className="gestion-datasets">
      <div className="header">
        <div className="header-info">
          <h1>Gestión de Conjuntos de Datos</h1>
          <p>Crea, edita y gestiona los conjuntos de datos del observatorio.</p>
        </div>
      </div>

      {/* FILTROS MEJORADOS */}
<div className="filters-section">
  <div className="filters-grid">
    <div className="input-wrapper search-wrapper">
      <label>Buscar</label>
      <input 
        type="text" 
        name="nombre" 
        placeholder="Nombre del dataset..." 
        value={filters.nombre} 
        onChange={handleChange} 
      />
    </div>

    <div className="input-wrapper">
      <label>Categoría</label>
      <select name="category_id" value={filters.category_id} onChange={handleChange}>
        <option value="">Todas las categorías</option>
        {categorias.map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
      </select>
    </div>

    <div className="input-wrapper">
      <label>Institución</label>
      <select name="institucion_id" value={filters.institucion_id} onChange={handleChange}>
        <option value="">Todas las instituciones</option>
        {instituciones.map(inst => (
          <option key={inst.institution_id} value={inst.institution_id}>
            {inst.legal_name || inst.name}
          </option>
        ))}
      </select>
    </div>

    <div className="input-wrapper">
      <label>Estado</label>
      <select name="estado" value={filters.estado} onChange={handleChange}>
        <option value="">Cualquier estado</option>
        <option value="published">Publicado</option>
        <option value="draft">Borrador</option>
        <option value="rejected">Rechazado</option>
        <option value="pending_validation">En Revisión</option>
      </select>
    </div>

    <div className="input-wrapper">
      <label>Fecha de registro</label>
      <input type="date" name="fecha" value={filters.fecha} onChange={handleChange} />
    </div>

    <div className="filter-actions">
      <button className="btn-aplicar" onClick={handleSearch}>
        <Search size={16} /> APLICAR
      </button>
      <button className="btn-limpiar" onClick={handleClear} title="Limpiar filtros">
        <RotateCcw size={16} />
      </button>
    </div>
  </div>
</div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Institución</th>
              <th>Fecha de Registro</th>
              <th style={{ textAlign: 'center' }}>Estado</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {datasets.map((data) => {
              const status = (data.dataset_status || 'draft').toLowerCase();
              const id = data.dataset_id || data.id;

              return (
                <tr key={id}>
                  <td>{data.nombre}</td>
                  <td>{data.categoria}</td>
                  <td>{data.institucion}</td>
                  <td>{data.fecha}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`estado-badge ${status}`}>
                      {status === 'published' ? 'Publicado' : 
                       status === 'pending_validation' ? 'En Revisión' : 
                       status === 'archived' ? 'Archivado' :
                       status === 'rejected' ? 'Rechazado' :
                       status === 'draft' ? 'Borrador' :
                       status === 'deleted' ? 'Eliminado' : 'Desconocido'}
                    </span>
                  </td>
                  <td className="acciones">
                    
                    <CanView requiredPermission="data_management.write">
                      <Edit3 
                        className={`action-icon ${status === 'deleted' ? 'disabled' : ''}`} 
                        size={20} 
                        title="Editar Dataset"
                        onClick={() => status !== 'deleted' && setEditingDatasetId(id)}
                      />
                    </CanView>

                    <CanView requiredPermission="data_validation.execute">
                      <Eye 
                        className="action-icon" 
                        size={20} 
                        title="Ver Información"
                        onClick={() => setReviewingDatasetId(id)}
                      />
                    </CanView>

                    <CanView requiredPermission="data_management.delete">
                        {status === 'archived' ? (
                          <CheckCircle2 
                            className="action-icon btn-visible-icon" 
                            size={20} 
                            title="Hacer visible"
                            onClick={() => handleMostrar(id, data.nombre)}
                          />
                        ) : (
                          <EyeOff 
                            className={`action-icon btn-hide-icon ${status === 'deleted' || status === 'pending_validation' ? 'disabled' : ''}`} 
                            size={20} 
                            title="Ocultar Dataset"
                            onClick={() => (status !== 'deleted' && status !== 'pending_validation') && handleOcultar(id, data.nombre)}
                          />
                        )}

                      <Trash2 
                        className="action-icon btn-destruir-icon" 
                        size={20} 
                        title="Destruir Permanentemente"
                        onClick={() => handleDestruir(id, data.nombre)}
                      />
                    </CanView>

                    {status === 'pending_validation' && (
                      <CanView requiredPermission="data_validation.execute">
                        <AlertCircle 
                          className="action-icon btn-validate-icon" 
                          size={20} 
                          title="Validación Pendiente"
                          onClick={() => setValidatingDatasetId(id)}
                        />
                      </CanView>
                    )}

                    {status === 'rejected' && (
                      <RotateCcw 
                        className="action-icon btn-rejected-icon" 
                        size={20} 
                        title="Ver Motivo de Rechazo"
                        onClick={() => alert(`Motivo de rechazo del dataset ID: ${id}`)}
                      />
                    )}
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

export default GestionDatasets;