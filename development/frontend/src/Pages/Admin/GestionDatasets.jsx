import { useState, useEffect } from "react";
import "../../styles/pages_styles/Admin/GestionDatasets.css";
import CanView from "../../Components/Common/CanView";
import CrearDataset from "./CrearDataset";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../Context/AuthContext";

function GestionDatasets() {
  const navigate = useNavigate();

  const { user } = useAuth(); 

  const [filters, setFilters] = useState({ nombre: "", categoria: "", estado: "", fecha: "" });
  const [isCreating, setIsCreating] = useState(false);

  // 3. Empezamos con un arreglo vacío
  const [datasets, setDatasets] = useState([]);

  // 👇 4. EFECTO PARA TRAER LOS DATOS REALES DE POSTGRESQL 👇
  useEffect(() => {
    if (user?.token) {
      fetchDatasets();
    }
  }, [user?.token]);

  const fetchDatasets = async () => {
    try {
      // Hacemos el GET a la ruta que armamos en tu backend
      const res = await fetch("http://localhost:3000/api/datasets", {
        headers: { 
          "Authorization": `Bearer ${user.token}` 
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        // Tu backend responde con { ok: true, data: [...] }
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
    // Aquí luego conectas con backend
  };

  const handleClear = () => {
    setFilters({
      nombre: "",
      categoria: "",
      estado: "",
      fecha: ""
    });
  };
  
  if (isCreating) {
    return <CrearDataset onCancel={() => setIsCreating(false)} />;
  }

  return (
    <div className="gestion-datasets">

      {/* HEADER */}
      <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="header-info">
          <h1>Gestión de Conjunto de Datos</h1>
          <p>Administra, filtra y gestiona los datasets disponibles en el sistema.</p>
        </div>
        
        <div className="header-actions">
          <CanView requiredPermission="data_management.write">
            <button 
              className="btn-create" 
              style={{ padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
              // 👇 Cambiamos la acción para que navegue a la nueva página
              onClick={() => setIsCreating(true)}
            >
              + Nuevo Dataset
            </button>
          </CanView>
        </div>
      </div>

      {/* FILTROS */}
      <div className="filters-container">

        <input
          type="text"
          name="nombre"
          placeholder="Buscar por nombre"
          value={filters.nombre}
          onChange={handleChange}
        />

        <select
          name="categoria"
          value={filters.categoria}
          onChange={handleChange}
        >
          <option value="">Categoría</option>
          <option value="Salud">Salud</option>
          <option value="Educación">Educación</option>
        </select>

        <select
          name="estado"
          value={filters.estado}
          onChange={handleChange}
        >
          <option value="">Estado</option>
          <option value="Publicado">Publicado</option>
          <option value="Pendiente">Pendiente</option>
        </select>

        <input
          type="date"
          name="fecha"
          value={filters.fecha}
          onChange={handleChange}
        />

        <div className="filter-buttons">
          <button className="btn-search" onClick={handleSearch}>
            Buscar
          </button>
          <button className="btn-clear" onClick={handleClear}>
            Limpiar
          </button>
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
              <th>Fecha Registro</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {datasets.map((data) => (
              <tr key={data.id}>
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
                  <CanView requiredPermission="data_management.write">
                    <button className="btn-edit">Editar</button>
                  </CanView>

                  <CanView requiredPermission="data_validation.execute">
                    <button className="btn-view">Revisar</button>
                  </CanView>

                  <CanView requiredPermission="data_management.delete">
                    <button className="btn-delete">Eliminar</button>
                  </CanView>
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