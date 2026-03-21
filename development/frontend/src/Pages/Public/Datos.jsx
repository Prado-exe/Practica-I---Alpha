import { useState, useEffect } from "react";
import Breadcrumb from "../../Components/Common/Breadcrumb";
import Pagination from "../../Components/Common/Pagination";
import AccordionFilter from "../../Components/Datos/AccordionFilter";
import DatasetCard from "../../Components/Datos/DatasetCard";
import SearchBarAdvanced from "../../Components/Common/SearchBarAdvanced";
import { getDatasets } from "../../Services/DatasetService";
import "../../Styles/Pages_styles/Public/Datos.css"

function Datos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [appliedFilters, setAppliedFilters] = useState({});

  const [datasets, setDatasets] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);

  // 🔥 debounce
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchTerm]);

  // 🔥 reset página
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, appliedFilters]);

  // 🔥 fetch API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        const res = await getDatasets({
          search: debouncedSearch,
          filters: appliedFilters,
          page: currentPage,
          limit: 7
        });

        setDatasets(res.data);
        setTotalPages(res.totalPages);
        setTotalResults(res.total);

      } catch (err) {
        console.error("Error cargando datasets", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [debouncedSearch, appliedFilters, currentPage]);

  return (
    <div className="datos-page">
      <Breadcrumb paths={["Inicio", "Datos"]} />

      <div className="datos-container">

        {/* FILTROS */}
        <aside className="datos-filters" aria-label="Filtros">

          <AccordionFilter
            title="Categoría"
            options={["Salud", "Educación", "Economía"]}
            onChange={(value) =>
              setAppliedFilters(prev => ({ ...prev, categoria: value }))
            }
          />

          <AccordionFilter
            title="Región"
            options={["Norte", "Centro", "Sur"]}
            onChange={(value) =>
              setAppliedFilters(prev => ({ ...prev, region: value }))
            }
          />

          <AccordionFilter
            title="Fecha"
            isDateFilter
            onChange={(value) =>
              setAppliedFilters(prev => ({ ...prev, fecha: value }))
            }
          />

        </aside>

        {/* MAIN */}
        <main className="datos-main" role="main">

          <SearchBarAdvanced
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="datos-header">
            <h1>Datasets</h1>
            <p aria-live="polite">{totalResults} encontrados</p>
          </div>

          <hr className="datos-separator" />

          {/* Chips */}
          <div className="applied-filters">
            {Object.entries(appliedFilters).length > 0 ? (
              Object.entries(appliedFilters).map(([key, value]) => (
                value && (
                  <span key={key} className="filter-chip">
                    {key}: {value}
                    <button
                      onClick={() =>
                        setAppliedFilters(prev => {
                          const updated = { ...prev };
                          delete updated[key];
                          return updated;
                        })
                      }
                      aria-label={`Eliminar filtro ${key}`}
                    >
                      ✕
                    </button>
                  </span>
                )
              ))
            ) : (
              <p>No hay filtros aplicados</p>
            )}
          </div>

          {/* LISTADO */}
          {loading ? (
            <p className="loading">Cargando datasets...</p>
          ) : datasets.length === 0 ? (
            <p className="no-results">No se encontraron datasets</p>
          ) : (
            <div className="datasets-list">
              {datasets.map(ds => (
                <DatasetCard key={ds.id} dataset={ds} />
              ))}
            </div>
          )}

          <hr className="datos-separator" />

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}

        </main>
      </div>
    </div>
  );
}

export default Datos;