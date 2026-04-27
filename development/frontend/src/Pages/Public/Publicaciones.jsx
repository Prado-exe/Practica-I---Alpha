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
      setDbCategories(
        cats.map(c => ({ label: c.name, value: c.name }))
      );
    });
  }, []);

  const availableYears = [...new Set(
    publications.map(p =>
      p.date ? new Date(p.date).getFullYear().toString() : null
    )
  )]
    .filter(Boolean)
    .sort((a, b) => b - a)
    .map(y => ({ label: y, value: y }));

  const filtersConfig = [
    {
      key: "type",
      title: "Tipo de publicación",
      options: dbCategories.length
        ? dbCategories
        : [{ label: "Cargando...", value: "" }],
      defaultOpen: false
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

  const removeFilter = (key) => {
    setFilters(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
    setPage(1);
  };

  const clearAll = () => {
    setFilters({});
    setSearch("");
    setPage(1);
  };

  return (
    <div className="publicaciones-page">
      <Breadcrumb paths={["Inicio", "Publicaciones"]} />

      <div className="publicaciones-layout">

        {/* SIDEBAR */}
        <aside className="publicaciones-sidebar">

          <div className="sidebar-header">
            <h3>Filtros</h3>
            {Object.keys(filters).length > 0 && (
              <button className="btn-clear-filters-text" onClick={clearAll}>
                Limpiar
              </button>
            )}
          </div>

          <div className="accordion-container">
            <AccordionFilter
              filters={filtersConfig}
              selectedFilters={filters}
              onChange={handleFilterChange}
              onClear={clearAll}
            />
          </div>

        </aside>

        {/* CONTENT */}
        <main className="publicaciones-content">

          <SearchBarAdvanced
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar publicaciones..."
          />

          {/* HEADER estilo Datos */}
          <div className="publicaciones-header">
            <div className="header-title">
              <BookOpen className="header-icon" size={28} />
              <h1>Publicaciones</h1>
            </div>

            <span className="results-badge">
              {totalResults} resultados
            </span>
          </div>

          {/* CHIPS (igual Datos) */}
          {Object.keys(filters).length > 0 && (
            <div className="filters-chips">
              {Object.entries(filters).map(([key, values]) =>
                Array.isArray(values) && values.length > 0 && (
                  <button
                    key={key}
                    className="chip"
                    onClick={() => removeFilter(key)}
                  >
                    <span className="chip-key">{key}:</span>
                    <span className="chip-val">{values.length} sel.</span>
                    <X size={14} className="chip-icon" />
                  </button>
                )
              )}
            </div>
          )}

          <hr className="publicaciones-separator" />

          <p className="publicaciones-count">
            Mostrando{" "}
            <strong>
              {totalResults === 0 ? 0 : (page - 1) * 7 + 1}-
              {Math.min(page * 7, totalResults)}
            </strong>{" "}
            de <strong>{totalResults}</strong> publicaciones
          </p>

          {/* LISTADO */}
          {loading ? (
            <div className="loading-state">
              <Loader2 className="spinner-large" size={40} />
              <p>Cargando publicaciones...</p>
            </div>
          ) : publications.length === 0 ? (
            <div className="empty-state">
              <FilterX size={48} className="empty-icon" />
              <h3>No se encontraron publicaciones</h3>
              <p>Intenta ajustar filtros o búsqueda.</p>
              <button className="btn-empty-clear" onClick={clearAll}>
                Limpiar filtros
              </button>
            </div>
          ) : (
            <div className="publicaciones-list fade-in">
              {publications.map(pub => (
                <PublicationCard key={pub.id} publication={pub} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="pagination-wrapper">
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