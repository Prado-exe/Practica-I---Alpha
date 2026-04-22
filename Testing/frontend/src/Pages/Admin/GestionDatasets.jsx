import { useState, useEffect } from "react";
import "../../styles/pages_styles/Admin/GestionDatasets.css";
import { FiSearch, FiEdit, FiList, FiTrash2, FiSend, FiEye, FiPlusCircle } from "react-icons/fi"; 
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
  
  // IDs para vistas modales/condicionales
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

  const fetchDatasets = async () => {
    try {
      const res = await fetch(`${API_URL}/api/datasets`, {
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDatasets(data.data || data || []); 
      } else {
        console.error("Error al obtener los datasets");
      }
    } catch (error) {
      console.error("Error de red:", error);
    }
  };

  // --- MANEJO DE EVENTOS ---
  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearch = () => {
    console.log("Aplicando filtros:", filters);
    // Aquí podrías implementar la lógica de filtrado hacia el API
  };

  const handleClear = () => {
    setFilters({ nombre: "", category_id: "", estado: "", fecha: "", institucion_id: "" });
  };

  const handleEliminar = async (id, nombre) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar permanentemente "${nombre}"?`)) {
      return;
    }
    
    try {
      const res = await fetch(`${API_URL}/api/datasets/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      
      if (res.ok) {
        alert("Dataset eliminado con éxito.");
        fetchDatasets();
      } else {
        const err = await res.json();
        alert(`Error al eliminar: ${err.message}`);
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
      alert("Error de red.");
    }
  };

  // --- RENDERIZADOS CONDICIONALES (VISTAS) ---
  if (isCreating) {
    return <CrearDataset onCancel={() => { setIsCreating(false); fetchDatasets(); }} />;
  }

  if (reviewingDatasetId) {
    return (
      <RevisarDataset 
        datasetId={reviewingDatasetId} 
        onCancel={() => { setReviewingDatasetId(null); fetchDatasets(); }} 
      />
    );
  }

  if (editingDatasetId) {
    return (
      <EditarDataset 
        datasetId={editingDatasetId} 
        onCancel={() => { setEditingDatasetId(null); fetchDatasets(); }} 
      />
    );
  }

  if (validatingDatasetId) {
    return (
      <ValidarDataset 
        datasetId={validatingDatasetId} 
        onCancel={() => { setValidatingDatasetId(null); fetchDatasets(); }} 
      />
    );
  }

  return (
    <div className="gestion-datasets">
      {/* HEADER */}
      <div className="header">
        <div className="header-info">
          <h1>Gestión de Conjuntos de Datos</h1>
          <p>Crea, edita y gestiona los conjuntos de datos del observatorio.</p>
        </div>
        <button className="btn-create" onClick={() => setIsCreating(true)}>
          <FiPlusCircle size={18} /> Agregar Dataset
        </button>
      </div>

      {/* FILTROS */}
      <div className="filters-section">
        <div className="filters-row-top">
          <div className="input-wrapper search-wrapper">
            <label>Buscar</label>
            <div className="input-with-icon">
              <FiSearch className="icon" />
              <input type="text" name="nombre" placeholder="Nombre del dataset..." value={filters.nombre} onChange={handleChange} />
            </div>
          </div>

          <div className="input-wrapper">
            <label>Categoría</label>
            <select name="category_id" value={filters.category_id} onChange={handleChange}>
              <option value="">Cualquier</option>
              {categorias.map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
            </select>
          </div>

          <div className="input-wrapper">
            <label>Institución</label>
            <select name="institucion_id" value={filters.institucion_id} onChange={handleChange}>
              <option value="">Cualquier</option>
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
              <option value="">Cualquier</option>
              <option value="published">Publicado</option>
              <option value="draft">Borrador</option>
              <option value="rejected">Rechazado</option>
              <option value="pending_validation">En Revisión</option>
            </select>
          </div>
        </div>

        <div className="filters-row-bottom">
          <div className="input-wrapper">
            <label>Fecha de registro</label>
            <input type="date" name="fecha" value={filters.fecha} onChange={handleChange} />
          </div>
          <button className="btn-aplicar" onClick={handleSearch}>APLICAR</button>
          <button className="btn-limpiar" onClick={handleClear}>LIMPIAR</button>
        </div>
      </div>

      {/* TABLA */}
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
                  <td>
                    <span className={`estado ${status}`}>
                      {status === 'published' ? 'Publicado' : 
                       status === 'pending_validation' ? 'En Revisión' : 
                       status === 'archived' ? 'Archivado' :
                       status === 'rejected' ? 'Rechazado' :
                       status === 'draft' ? 'Borrador' :
                       status === 'deleted' ? 'Eliminado' : 'Desconocido'}
                    </span>
                  </td>
                  <td className="acciones" style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    
                    <CanView requiredPermission="data_management.write">
                      <button 
                        className="btn-edit"
                        onClick={() => setEditingDatasetId(id)}
                        disabled={status === 'deleted'}
                      >
                        Editar
                      </button>
                    </CanView>

                    <CanView requiredPermission="data_validation.execute">
                      <button 
                        className="btn-view" 
                        onClick={() => setReviewingDatasetId(id)}
                      >
                        Información
                      </button>
                    </CanView>

                    <CanView requiredPermission="data_management.delete">
                      <button 
                        className="btn-delete" 
                        style={{ 
                          backgroundColor: status === 'deleted' ? '#cccccc' : '#f44336', 
                          cursor: status === 'deleted' ? 'not-allowed' : 'pointer'
                        }}
                        onClick={() => handleEliminar(id, data.nombre)}
                        disabled={status === 'deleted'}
                      >
                        {status === 'deleted' ? 'Eliminado' : 'Eliminar'}
                      </button>
                    </CanView>

                    {/* Botones Especiales */}
                    {status === 'pending_validation' && (
                      <CanView requiredPermission="data_validation.execute">
                        <button 
                          className="btn-validate"
                          style={{ backgroundColor: '#ff9800', color: 'white', padding: '5px 10px', borderRadius: '4px', fontWeight: 'bold' }}
                          onClick={() => setValidatingDatasetId(id)}
                        >
                          📋 Validación
                        </button>
                      </CanView>
                    )}

                    {status === 'rejected' && (
                      <button 
                        className="btn-rejected-reason"
                        style={{ backgroundColor: '#d32f2f', color: 'white', padding: '5px 10px', borderRadius: '4px', fontWeight: 'bold' }}
                        onClick={() => alert(`Motivo de rechazo del dataset ID: ${id}`)}
                      >
                        Motivo Rechazo
                      </button>
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