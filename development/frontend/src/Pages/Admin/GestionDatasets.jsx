import { useState, useEffect } from "react";
import "../../styles/pages_styles/Admin/GestionDatasets.css";
import { FiSearch, FiEdit, FiList, FiTrash2, FiSend, FiEye, FiPlusCircle } from "react-icons/fi"; 
import CanView from "../../Components/Common/CanView";
import CrearDataset from "./CrearDataset";
import EditarDataset from "./EditarDataset"; 
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function GestionDatasets() {
  const navigate = useNavigate();
  const { user } = useAuth(); 

  // Estados
  const [filters, setFilters] = useState({ 
    nombre: "", 
    category_id: "", 
    estado: "", 
    fecha: "", 
    institucion_id: "" 
  });
  
  const [isCreating, setIsCreating] = useState(false);
  const [editingDataset, setEditingDataset] = useState(null); 
  
  const [datasets, setDatasets] = useState([]);
  const [instituciones, setInstituciones] = useState([]);
  const [categorias, setCategorias] = useState([]);

  // Carga inicial
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
        console.error("Error al obtener los datasets del backend");
      }
    } catch (error) {
      console.error("Error de red:", error);
    }
  };

  // Funciones auxiliares para nombres
  const getCategoryName = (id) => {
    const category = categorias.find(c => c.category_id === id);
    return category ? category.name : 'Desconocida';
  };

  const getInstitutionName = (id) => {
    if (!id) return 'Sin Institución';
    const institution = instituciones.find(i => i.institution_id === id);
    return institution ? (institution.legal_name || institution.name) : 'Desconocida';
  };

  // Manejo de filtros
  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearch = () => {
    console.log("Aplicando filtros:", filters);
    // Lógica para enviar filtros al backend o filtrar localmente
  };

  const handleClear = () => {
    setFilters({ nombre: "", category_id: "", estado: "", fecha: "", institucion_id: "" });
  };
  
  // ---> NUEVA FUNCIÓN PARA ELIMINAR <---
  const handleDelete = async (id) => {
    const confirmacion = window.confirm("¿Estás seguro de que deseas eliminar este dataset? Esta acción no se puede deshacer.");
    
    if (!confirmacion) return;

    try {
      const res = await fetch(`${API_URL}/api/datasets/${id}`, {
        method: "DELETE",
        headers: { 
          "Authorization": `Bearer ${user.token}` 
        }
      });

      if (res.ok) {
        alert("Dataset eliminado con éxito.");
        fetchDatasets(); // Recargamos la tabla
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error("Error del servidor al eliminar:", errorData);
        alert(`No se pudo eliminar: ${errorData.message || 'Error del servidor (Posible 404)'}`);
      }
    } catch (error) {
      console.error("Error de red al eliminar:", error);
      alert("Ocurrió un error al intentar comunicar con el servidor.");
    }
  };

  // Renderizados condicionales para las vistas de Crear y Editar
  if (isCreating) {
    return <CrearDataset onCancel={() => { setIsCreating(false); fetchDatasets(); }} />;
  }

  if (editingDataset) {
    return <EditarDataset 
      dataset={editingDataset} 
      onCancel={() => { setEditingDataset(null); fetchDatasets(); }} 
    />;
  }

  // Vista principal de Gestión
  return (
    <div className="gestion-datasets">
      {/* HEADER */}
      <div className="header">
        <div className="header-info">
          <h1>Gestión de Conjuntos de Datos</h1>
          <p>Crea, edita y elimina conjuntos de datos del observatorio de datos sostenible y gestiona las distribuciones de los conjuntos de datos</p>
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
              <input type="text" name="nombre" placeholder="Buscar por el nombre del dataset" value={filters.nombre} onChange={handleChange} />
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
              {instituciones.map(inst => <option key={inst.institution_id} value={inst.institution_id}>{inst.legal_name || inst.name}</option>)}
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
              const currentStatus = (data.dataset_status || data.status || 'draft').toLowerCase();
              
              let statusClass = 'borrador';
              let displayStatus = 'Borrador';

              if (currentStatus === 'published' || currentStatus === 'publicado') {
                statusClass = 'publicado';
                displayStatus = 'Publicado';
              } else if (currentStatus === 'rejected' || currentStatus === 'rechazado') {
                statusClass = 'rechazado';
                displayStatus = 'Rechazado';
              } else if (currentStatus === 'pending_validation') {
                statusClass = 'revision';
                displayStatus = 'En Revisión';
              }

              const displayNombre = data.title || data.nombre || 'Sin título';
              const displayFecha = data.fecha || (data.creation_date ? new Date(data.creation_date).toLocaleDateString() : 'Sin fecha');

              return (
                <tr key={data.dataset_id || data.id}>
                  <td>{displayNombre}</td>
                  <td>{data.categoria || getCategoryName(data.category_id)}</td>
                  <td>{data.institucion || getInstitutionName(data.institution_id)}</td>
                  <td>{displayFecha}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`estado-badge ${statusClass}`}>
                      {displayStatus}
                    </span>
                  </td>
                  <td className="acciones">
                    {/* Botones condicionales según estado */}
                    {statusClass === 'borrador' && <FiSend className="action-icon" title="Enviar a Validación" />}
                    {statusClass === 'rechazado' && <FiEye className="action-icon" title="Ver Motivo de Rechazo" />}
                    
                    {/* Botón de Editar */}
                    <FiEdit 
                      className="action-icon" 
                      title="Editar" 
                      onClick={() => setEditingDataset(data)} 
                    />
                    
                    {/* Botón de Distribuciones */}
                    <FiList className="action-icon" title="Distribuciones" />
                    
                    {/* Botón de Eliminar */}
                    <FiTrash2 
                      className="action-icon" 
                      title="Eliminar" 
                      onClick={() => handleDelete(data.dataset_id || data.id)} 
                      style={{ color: '#dc3545' }}
                    />
                  </td>
                </tr>
              );
            })}
            
            {datasets.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                  No se encontraron datasets registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default GestionDatasets;