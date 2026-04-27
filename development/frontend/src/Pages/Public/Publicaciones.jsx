import { useState, useEffect } from "react";
import { BookOpen, Loader2, X, FilterX } from "lucide-react";

import Breadcrumb from "../../Components/Common/Breadcrumb";
import SearchBarAdvanced from "../../Components/Common/SearchBarAdvanced";
import Pagination from "../../Components/Common/Pagination";
import AccordionFilter from "../../Components/Common/AccordionFilter";
import PublicationCard from "../../Components/Cards/PublicationCard";

import { getPublications, getCategories } from "../../Services/PublicacionesService";
import { useFetchList } from "../../Components/Hooks/useFetchList";

import "../../Styles/Pages_styles/Public/Publicaciones.css";

function Publicaciones() {
  const [dbCategories, setDbCategories] = useState([]);

  const {
    search, setSearch,
    filters, setFilters,
    page, setPage,
    data: publications,
    totalPages,
    totalResults,
    loading
  } = useFetchList(getPublications, { limit: 7 });

  useEffect(() => {
    getCategories().then(cats => {
      setDbCategories(cats.map(c => ({ label: c.name, value: c.name })));
    });
  }, []);

  const availableYears = [...new Set(
    publications.map(p => p.date ? new Date(p.date).getFullYear().toString() : null)
  )]
    .filter(Boolean)
    .sort((a, b) => b - a)
    .map(y => ({ label: y, value: y }));

  const filtersConfig = [
    {
      key: "type",
      title: "Tipo de publicación",
      options: dbCategories.length ? dbCategories : [{ label: "Cargando...", value: "" }]
    },
    {
      key: "year",
      title: "Año",
      options: availableYears
    }
  ];

  const handleFilterChange = (key, values) => {
    setFilters(prev => ({ ...prev, [key]: values }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setSearch("");
    setPage(1);
  };

  const removeFilter = (key) => {
    setFilters(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
    setPage(1);
  };

  return (
    <div className="publicaciones-v1-page">
      <Breadcrumb paths={["Inicio", "Publicaciones"]} />

      <div className="publicaciones-v1-layout">

        {/* SIDEBAR */}
        <aside className="publicaciones-v1-sidebar">

          <div className="publicaciones-v1-sidebar-header">
            <h3>Filtros</h3>

            {Object.keys(filters).length > 0 && (
              <button
                className="publicaciones-v1-clear-btn"
                onClick={clearFilters}
              >
                Limpiar
              </button>
            )}
          </div>

          <div className="publicaciones-v1-accordion-container">
            <AccordionFilter
              filters={filtersConfig}
              selectedFilters={filters}
              onChange={handleFilterChange}
              onClear={clearFilters}
            />
          </div>

        </aside>

        {/* CONTENT */}
        <main className="publicaciones-v1-content">

          <SearchBarAdvanced
            placeholder="Buscar publicaciones..."
            onSearch={(query) => {
              if (query !== search) {
                setSearch(query);
                setPage(1);
              }
            }}
          />

          {/* HEADER AISLADO */}
          <div className="publicaciones-v1-header">

            <div className="publicaciones-v1-title">
              <BookOpen className="publicaciones-v1-icon" size={28} />
              <h1>Publicaciones</h1>
            </div>

            <span className="publicaciones-v1-badge">
              {totalResults} resultados
            </span>

          </div>

          {/* CHIPS AISLADOS */}
          {Object.keys(filters).length > 0 && (
            <div className="publicaciones-v1-chips">
              {Object.entries(filters).map(([key, values]) =>
                Array.isArray(values) && values.length > 0 && (
                  <button
                    key={key}
                    className="publicaciones-v1-chip"
                    onClick={() => removeFilter(key)}
                  >
                    <span className="publicaciones-v1-chip-key">{key}:</span>
                    <span className="publicaciones-v1-chip-val">
                      {values.length} sel.
                    </span>
                    <X size={14} />
                  </button>
                )
              )}
            </div>
          )}

          {/* SEPARADOR PROPIO */}
          <hr className="publicaciones-v1-divider" />

          {/* COUNT */}
          <p className="publicaciones-v1-count">
            Mostrando{" "}
            <strong>
              {totalResults === 0 ? 0 : (page - 1) * 7 + 1}-
              {Math.min(page * 7, totalResults)}
            </strong>{" "}
            de <strong>{totalResults}</strong> publicaciones
          </p>

          {/* STATES */}
          {loading ? (
            <div className="publicaciones-v1-loading">
              <Loader2 className="publicaciones-v1-spinner" size={40} />
              <p>Cargando publicaciones...</p>
            </div>
          ) : publications.length === 0 ? (
            <div className="publicaciones-v1-empty">
              <FilterX size={48} className="publicaciones-v1-empty-icon" />
              <h3>No se encontraron publicaciones</h3>
              <p>Intenta ajustar filtros o búsqueda.</p>

              <button
                className="publicaciones-v1-btn-empty"
                onClick={clearFilters}
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <div className="publicaciones-v1-grid">
              {publications.map(pub => (
                <PublicationCard key={pub.id} publication={pub} />
              ))}
            </div>
          )}

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="publicaciones-v1-pagination">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

export default Publicaciones;