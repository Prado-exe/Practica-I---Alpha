import { useState, useMemo } from "react";
import Breadcrumb from "../Components/Common/Breadcrumb"
import Pagination from "../Components/Common/Pagination";
import AccordionFilter from "../Components/Datos/AccordionFilter";
import DatasetCard from "../Components/Datos/DatasetCard"; // Cada dataset como tarjeta
import "../Styles/Pages_styles/Datos.css";
import { datasets } from "../data/Datasets";
import SearchBarAdvanced from "../Components/Common/SearchBarAdvanced";

function Datos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [appliedFilters, setAppliedFilters] = useState({});
  const datasetsPerPage = 7;

  // Filtrado básico (puedes integrar acordeones y filtros avanzados)
  const filteredDatasets = useMemo(() => {
    return datasets.filter(ds =>
      ds.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  // Paginación
  const totalPages = Math.ceil(filteredDatasets.length / datasetsPerPage);
  const currentDatasets = filteredDatasets.slice(
    (currentPage - 1) * datasetsPerPage,
    currentPage * datasetsPerPage
  );

  return (
    <div className="datos-page">
      {/* Breadcrumb */}
      <Breadcrumb paths={["Inicio", "Datos"]} />

      <div className="datos-container">
        {/* Contenedor Izquierdo: Acordeones de filtro */}
        <aside className="datos-filters">
          <AccordionFilter title="Categoría 1" />
          <AccordionFilter title="Categoría 2" />
          <AccordionFilter title="Categoría 3" />
          <AccordionFilter title="Categoría 4" />
          <AccordionFilter title="Categoría 5" />
          <AccordionFilter title="Filtrar por fecha" isDateFilter />
        </aside>

        {/* Contenedor Derecho: Buscador y datasets */}
        <main className="datos-main">
          {/* Buscador */}
          <SearchBarAdvanced value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />

          {/* Título y cantidad */}
          <div className="datos-header">
            <h1>Datasets</h1>
            <p>{filteredDatasets.length} datasets encontrados</p>
          </div>

          {/* Separador */}
          <hr className="datos-separator" />

          {/* Filtros aplicados */}
          <div className="applied-filters">
            {Object.keys(appliedFilters).length > 0 ? (
              Object.entries(appliedFilters).map(([key, value]) => (
                <span key={key} className="filter-chip">
                  {key}: {value}
                </span>
              ))
            ) : (
              <p>No hay filtros aplicados</p>
            )}
          </div>

          {/* Listado de datasets */}
          <div className="datasets-list">
            {currentDatasets.map((ds, index) => (
              <DatasetCard key={index} dataset={ds} />
            ))}
          </div>

          {/* Separador y paginador */}
          <hr className="datos-separator" />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </main>
      </div>
    </div>
  );
}

export default Datos;