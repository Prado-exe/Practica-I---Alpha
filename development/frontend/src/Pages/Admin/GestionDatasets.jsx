import { useState } from "react";
import "../../styles/pages_styles/Admin/GestionDatasets.css";
import CanView from "../../Components/Common/CanView";

function GestionDatasets() {

  const [filters, setFilters] = useState({
    nombre: "",
    categoria: "",
    estado: "",
    fecha: ""
  });

  const [datasets, setDatasets] = useState([
    {
      id: 1,
      nombre: "Dataset Salud 2024",
      categoria: "Salud",
      institucion: "Ministerio de Salud",
      fecha: "2024-03-10",
      estado: "Publicado"
    },
    {
      id: 2,
      nombre: "Educación Escolar",
      categoria: "Educación",
      institucion: "MINEDUC",
      fecha: "2023-11-22",
      estado: "Pendiente"
    }
  ]);

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

  return (
    <div className="gestion-datasets">

      {/* HEADER */}
      <div className="header">
        <h1>Gestión de Conjunto de Datos</h1>
        <p>Administra, filtra y gestiona los datasets disponibles en el sistema.</p>
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
                  <span className={`estado ${data.estado.toLowerCase()}`}>
                    {data.estado}
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