import { useState, useEffect } from "react";
import "../../styles/pages_styles/Admin/GestionDatasets.css";
import CanView from "../../Components/Common/CanView";
import CrearDataset from "./CrearDataset";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../Context/AuthContext";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function GestionDatasets() {
  const navigate = useNavigate();
  const { user } = useAuth(); 

  // El estado se llama 'filters'
  const [filters, setFilters] = useState({ 
    nombre: "", 
    category_id: "", // Cambiado 'categoria' por 'category_id' para coincidir con el name del select
    estado: "", 
    fecha: "", 
    institucion_id: "" 
  });
  
  const [isCreating, setIsCreating] = useState(false);
  const [datasets, setDatasets] = useState([]);
  
  const [instituciones, setInstituciones] = useState([]);
  // El estado se llama 'categorias'
  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    if (user?.token) {
      fetchDatasets();
      fetchFilterOptions();
    }
  }, [user?.token]);

  const fetchFilterOptions = async () => {
  try {
    // CORRECCIÓN: Carga de instituciones usando el método autenticado
    const instRes = await fetch(`${API_URL}/api/instituciones`, {
      headers: { "Authorization": `Bearer ${user.token}` }
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
      const res = await fetch("http://localhost:3000/api/datasets", {
        headers: { 
          "Authorization": `Bearer ${user.token}` 
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setDatasets(data.data || []); 
      } else {
        console.error("Error del backend leyendo datasets");
      }
    } catch (error) {
      console.error("Error de red:", error);
    }
  };

  const handleChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const handleSearch = () => {
    console.log("Aplicar filtros:", filters);
  };

  const handleClear = () => {
    setFilters({
      nombre: "",
      category_id: "",
      estado: "",
      fecha: "",
      institucion_id: ""
    });
  };
  
  if (isCreating) {
    return <CrearDataset onCancel={() => setIsCreating(false)} />;
  }

  return (
    <div className="gestion-datasets">

      <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="header-info">
          <h1>Gestión de Conjunto de Datos</h1>
          <p>Panel integral para la administración de datos del sistema.</p>
        </div>
        
        <div className="header-actions">
          <button 
            className="btn-create" 
            style={{ padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
            onClick={() => setIsCreating(true)}
          >
            + Nuevo Dataset
          </button>
        </div>
      </div>

      <div className="filters-container">
        <input type="text" name="nombre" placeholder="Buscar por nombre" value={filters.nombre} onChange={handleChange} />

        {/* CORRECCIÓN: Usar filters.category_id y mapear categorias */}
        <select name="category_id" value={filters.category_id} onChange={handleChange}>
          <option value="">Seleccione Categoría...</option>
          {categorias.map(c => (
            <option key={c.category_id} value={c.category_id}>
              {c.name}
            </option>
          ))}
        </select>

        <select name="institucion_id" value={filters.institucion_id} onChange={handleChange}>
          <option value="">Todas las Instituciones</option>
          {instituciones.map(inst => (
            <option key={inst.institution_id} value={inst.institution_id}>{inst.name}</option>
          ))}
        </select>

        <select name="estado" value={filters.estado} onChange={handleChange}>
          <option value="">Estado</option>
          <option value="Publicado">Publicado</option>
          <option value="Pendiente">Pendiente</option>
        </select>

        <input type="date" name="fecha" value={filters.fecha} onChange={handleChange} />

        <div className="filter-buttons">
          <button className="btn-search" onClick={handleSearch}>Buscar</button>
          <button className="btn-clear" onClick={handleClear}>Limpiar</button>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Institución</th>
              <th>Fecha Registro</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {datasets.map((data) => (
              <tr key={data.dataset_id || data.id}>
                <td>{data.nombre}</td>
                <td>{data.categoria}</td>
                <td>{data.institucion}</td>
                <td>{data.fecha}</td>
                <td>
                  <span className={`estado ${(data.dataset_status || 'borrador').toLowerCase()}`}>
                    {data.dataset_status === 'published' ? 'Publicado' : 
                     data.dataset_status === 'pending_validation' ? 'En Revisión' : 
                     data.dataset_status || 'Desconocido'}
                  </span>
                </td>
                <td className="acciones">
                  <button className="btn-edit">Editar</button>
                  <button className="btn-view" style={{ backgroundColor: '#2196F3', color: 'white' }}>Revisar</button>
                  <button className="btn-delete" style={{ backgroundColor: '#f44336', color: 'white' }}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default GestionDatasets;