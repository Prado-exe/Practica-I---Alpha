import Breadcrumb from "../../Components/Common/Breadcrumb";
import Pagination from "../../Components/Common/Pagination";
import AccordionFilter from "../../Components/Common/AccordionFilter";
import DatasetCard from "../../Components/Cards/DatasetCard";
import SearchBarAdvanced from "../../Components/Common/SearchBarAdvanced";

import { useFetchList } from "../../Components/Hooks/useFetchList";
import { getDatasets } from "../../Services/DatasetService";

import "../../Styles/Pages_styles/Public/Datos.css";

function Datos() {
  const {
    search,
    setSearch,
    filters,
    setFilters,
    page,
    setPage,
    data,
    totalPages,
    totalResults,
    loading
  } = useFetchList(getDatasets, { limit: 7 });

  // 🔧 Config filtros
  const filtersConfig = [
    {
      key: "categoria",
      title: "Categoría",
      options: ["Salud", "Educación", "Economía"],
      defaultOpen: true
    },
    {
      key: "region",
      title: "Región",
      options: ["Norte", "Centro", "Sur"]
    },
    {
      key: "fecha",
      title: "Fecha",
      options: ["2025", "2024", "2023"]
    }
  ];

  // 🔹 manejar filtros
  const handleFilterChange = (key, values) => {
    setFilters(prev => ({
      ...prev,
      [key]: values
    }));
  };

  // 🔹 eliminar filtro individual
  const removeFilter = (key) => {
    setFilters(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };

  return (
    <div className="datos-page">

      <Breadcrumb paths={["Inicio", "Datasets"]} />

      <div className="datos-layout">

        {/* 🔹 SIDEBAR */}
        <aside className="datos-sidebar">
          <AccordionFilter
            filters={filtersConfig}
            selectedFilters={filters}
            onChange={handleFilterChange}
            onClear={() => setFilters({})}
          />
        </aside>

        {/* 🔹 MAIN */}
        <main className="datos-content">

          {/* 🔎 BUSCADOR */}
          <SearchBarAdvanced
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* 🔹 HEADER */}
          <div className="datos-header">
            <h1>Datasets</h1>
            <span>{totalResults} resultados</span>
          </div>

          {/* 🔹 CHIPS DE FILTROS */}
          {Object.keys(filters).length > 0 && (
            <div className="filters-chips">
              {Object.entries(filters).map(([key, values]) => (
                values.length > 0 && (
                  <button
                    key={key}
                    className="chip"
                    onClick={() => removeFilter(key)}
                  >
                    {key}: {values.join(", ")} ✕
                  </button>
                )
              ))}
            </div>
          )}
    
          {/* 🔹 SEPARADOR ANTES DE LOS DATASETS */}
          <hr className="datos-separator" />

          {/* 🔹 CONTENIDO */}
          {loading ? (
            <div className="loading-state">
              Cargando datasets...
            </div>
          ) : data.length === 0 ? (
            <div className="empty-state">
              <h3>No se encontraron resultados</h3>
              <p>Intenta cambiar los filtros o búsqueda</p>
            </div>
          ) : (
            <div className="datasets-grid">
              {data.map(ds => (
                <DatasetCard key={ds.id} dataset={ds} />
              ))}
            </div>
          )}

          {/* 🔹 PAGINACIÓN */}
          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          )}

        </main>
      </div>
    </div>
  );
}

export default Datos;