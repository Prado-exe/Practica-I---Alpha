import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiEdit, FiEye, FiPlusCircle, FiArchive, FiTrash2 } from "react-icons/fi"; 
import { useAuth } from "../../Context/AuthContext";
import EditarDataset from "./EditarDataset"; 
import "../../Styles/Pages_styles/Admin/GestionDatasets.css";
import DetalleDatasetInterno from "./DetalleDatasetInterno";
import EditarDatasetUsuario from "./EditarDatasetUsuario";


const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function MisDatasets() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [viewingDatasetId, setViewingDatasetId] = useState(null);
  const [editingDatasetId, setEditingDatasetId] = useState(null);
  

  useEffect(() => {
    if (user?.token) fetchMyDatasets();
  }, [user?.token]);

  const fetchMyDatasets = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/datasets/my`, {
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setDatasets(json.data || []);
      }
    } catch (error) {
      console.error("Error obteniendo mis datasets:", error);
    } finally {
      setLoading(false);
    }
  };

  // Función de borrado lógico / Petición de baja
  const handleEliminar = async (id, nombre, currentStatus) => {
    if (currentStatus === 'draft') {
      if (!window.confirm(`¿Estás seguro de eliminar el borrador "${nombre}"?`)) return;
    } else {
      if (!window.confirm(`¿Estás seguro de solicitar la baja (archivar) el dataset "${nombre}"?\n\nEsta acción requerirá la aprobación de un administrador.`)) return;
    }

    try {
      const res = await fetch(`${API_URL}/api/datasets/${id}/archive`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      
      if (res.ok) {
        alert(currentStatus === 'draft' ? "Borrador eliminado." : "Solicitud de baja enviada a revisión.");
        fetchMyDatasets(); 
      } else {
        const err = await res.json();
        alert(`Error al procesar: ${err.message}`);
      }
    } catch (error) {
      console.error("Error de red:", error);
      alert("Error de conexión con el servidor.");
    }
  };

  const handleSolicitarDestruccion = async (id, nombre, status) => {
  const confirmMsg = status === 'draft' 
    ? `¿Estás seguro de eliminar permanentemente el borrador "${nombre}"?`
    : `¿Estás seguro de solicitar la DESTRUCCIÓN TOTAL del dataset "${nombre}"?\n\nEsta acción enviará un ticket a los administradores para borrarlo físicamente de la base de datos y de los archivos.`;

  if (!window.confirm(confirmMsg)) return;

  try {
    // Si es borrador, el backend ya permite borrarlo directo o enviamos ticket 'destroy'
    const res = await fetch(`${API_URL}/api/datasets/${id}/request-destroy`, { // Necesitarás este endpoint
      method: "POST",
      headers: { "Authorization": `Bearer ${user.token}` }
    });
    
    if (res.ok) {
      alert("Solicitud de eliminación enviada con éxito.");
      fetchMyDatasets();
    }
  } catch (error) { console.error(error); }
};

  const filteredDatasets = datasets.filter(d => 
    (d.nombre || "").toLowerCase().includes(search.toLowerCase()) && d.dataset_status !== 'archived' && d.dataset_status !== 'deleted'
  );

  if (viewingDatasetId) {
    return <DetalleDatasetInterno datasetId={viewingDatasetId} onBack={() => setViewingDatasetId(null)} />;
  }

  if (editingDatasetId) {
    return <EditarDatasetUsuario datasetId={editingDatasetId} onCancel={() => { setEditingDatasetId(null); fetchMyDatasets(); }} />;
  }
  

  return (
    <div className="gestion-datasets">
      <div className="header">
        <div className="header-info">
          <h1>Mis Conjuntos de Datos</h1>
          <p>Gestiona los datasets creados por ti o por tu institución.</p>
        </div>
        <button className="btn-create" onClick={() => navigate("/administracion/proponer-dataset")}>
          <FiPlusCircle size={18} /> Nuevo Dataset
        </button>
      </div>

      <div className="filters-section">
        <div className="input-wrapper search-wrapper" style={{ maxWidth: '400px' }}>
          <label>Buscar en mis datasets</label>
          <div className="input-with-icon">
            <FiSearch className="icon" />
            <input 
              type="text" 
              placeholder="Buscar por título..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Fecha de Registro</th>
              <th style={{ textAlign: 'center' }}>Estado</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{textAlign:'center', padding: '20px'}}>Cargando datos...</td></tr>
            ) : filteredDatasets.length === 0 ? (
              <tr><td colSpan="5" style={{textAlign:'center', padding: '20px', color: '#666'}}>No tienes datasets activos asociados a tu cuenta.</td></tr>
            ) : filteredDatasets.map((data) => {
              
              const isLocked = data.dataset_status === 'pending_validation';
              const estadoFormat = {
                'draft': 'Borrador',
                'pending_validation': 'En Revisión (Bloqueado)',
                'published': 'Publicado',
                'rejected': 'Rechazado'
              };

              return (
                <tr key={data.id}>
                  <td style={{ fontWeight: '500' }}>{data.nombre}</td>
                  <td>{data.categoria}</td>
                  <td>{new Date(data.fecha).toLocaleDateString()}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`estado ${data.dataset_status}`}>
                      {estadoFormat[data.dataset_status] || data.dataset_status}
                    </span>
                  </td>
                  <td className="acciones" style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '8px' }}>
    
                      {/* 1. VER DETALLES (Internal Panel) */}
                      <button className="btn-view" title="Ver información detallada" onClick={() => setViewingDatasetId(data.id)}> 
                        <FiEye /> 
                      </button>
                      
                      {/* 2. EDITAR (Ahora usa el nuevo componente) */}
                      <button 
                        className="btn-edit" 
                        onClick={() => setEditingDatasetId(data.id)}
                        disabled={isLocked}
                        style={{ opacity: isLocked ? 0.5 : 1 }}
                      > 
                        <FiEdit /> 
                      </button>

                      {/* 3. SOLICITAR ARCHIVADO (Ocultar) */}
                      <button 
                        className="btn-archive" 
                        title="Solicitar ocultar del catálogo"
                        onClick={() => handleArchivar(data.id, data.nombre)}
                        disabled={isLocked}
                        style={{ background: 'none', border: 'none', color: isLocked ? '#ccc' : '#757575', cursor: 'pointer' }}
                      > 
                        <FiArchive size={18} /> 
                      </button>

                      {/* 4. SOLICITAR ELIMINACIÓN (Destrucción) */}
                      <button 
                        className="btn-delete" 
                        title="Solicitar eliminación permanente"
                        onClick={() => handleSolicitarDestruccion(data.id, data.nombre, data.dataset_status)}
                        disabled={isLocked}
                        style={{ background: 'none', border: 'none', color: isLocked ? '#ccc' : '#dc3545', cursor: 'pointer' }}
                      > 
                        <FiTrash2 size={18} /> 
                      </button>
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

export default MisDatasets;