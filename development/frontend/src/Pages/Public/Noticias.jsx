import { useState, useEffect } from "react";
import "../../Styles/Pages_styles/Public/Noticias.css";

import Breadcrumb from "../../Components/Common/Breadcrumb";
import SearchBarAdvanced from "../../Components/Common/SearchBarAdvanced";
import Pagination from "../../Components/Common/Pagination";
import AccordionFilter from "../../Components/Common/AccordionFilter";
import NoticiasCard from "../../Components/Cards/NoticiasCard";

import { useFetchList } from "../../Components/Hooks/useFetchList";
import { getNoticias, getNewsCategories } from "../../Services/NoticiasService";

import { Newspaper, X, Loader2, Inbox, FilterX } from "lucide-react";

function Noticias() {
  const [dbCategories, setDbCategories] = useState([]);

  const {
    search, setSearch,
    filters, setFilters,
    page, setPage,
    data: news,
    totalResults,
    loading,
    totalPages
  } = useFetchList(getNoticias, { limit: 7 });

  useEffect(() => {
    getNewsCategories().then(cats => {
      setDbCategories(cats.map(c => ({ label: c.name, value: c.name })));
    });
  }, []);

  const availableYears = [...new Set(
    news.map(n => n.date ? new Date(n.date).getFullYear().toString() : null)
  )]
    .filter(Boolean)
    .sort((a, b) => b - a)
    .map(y => ({ label: y, value: y }));

  const filtersConfig = [
    {
      key: "category",
      title: "Categoría",
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
    <div className="noticias-v1-page">
      <Breadcrumb paths={["Inicio", "Noticias"]} />

      <div className="noticias-v1-layout">

        {/* SIDEBAR */}
        <aside className="noticias-v1-sidebar">

          <div className="noticias-v1-sidebar-header">
            <h3>Filtros</h3>

            {Object.keys(filters).length > 0 && (
              <button
                className="noticias-v1-clear-btn"
                onClick={clearFilters}
              >
                Limpiar
              </button>
            )}
          </div>

          <div className="noticias-v1-accordion-container">
            <AccordionFilter
              filters={filtersConfig}
              selectedFilters={filters}
              onChange={handleFilterChange}
              onClear={clearFilters}
            />
          </div>

        </aside>

        {/* CONTENT */}
        <main className="noticias-v1-content">

          {/* SEARCH */}
          <SearchBarAdvanced
            placeholder="Buscar Noticias..."
            onSearch={(query) => {
              if (query !== search) {
                setSearch(query);
                setPage(1);
              }
            }}
          />

          {/* HEADER */}
          <div className="noticias-v1-header">

            <div className="noticias-v1-title">
              <Newspaper className="noticias-v1-title-icon" size={28} />
              <h1>Noticias</h1>
            </div>

            <span className="noticias-v1-badge">
              {totalResults} resultados
            </span>

          </div>

          {/* CHIPS */}
          {Object.keys(filters).length > 0 && (
            <div className="noticias-v1-chips">
              {Object.entries(filters).map(([key, values]) =>
                Array.isArray(values) && values.length > 0 && (
                  <button
                    key={key}
                    className="noticias-v1-chip"
                    onClick={() => removeFilter(key)}
                  >
                    <span className="noticias-v1-chip-key">
                      {key}:
                    </span>
                    <span className="noticias-v1-chip-val">
                      {values.length} sel.
                    </span>
                    <X size={14} />
                  </button>
                )
              )}
            </div>
          )}

          <hr className="noticias-v1-separator" />

          {/* COUNTER */}
          <p className="noticias-v1-count">
            Mostrando{" "}
            <strong>
              {totalResults === 0 ? 0 : (page - 1) * 7 + 1}-
              {Math.min(page * 7, totalResults)}
            </strong>{" "}
            de <strong>{totalResults}</strong> noticias
          </p>

          {/* STATES */}
          {loading ? (
            <div className="noticias-v1-loading">
              <Loader2 className="noticias-v1-spinner" size={40} />
              <p>Cargando noticias...</p>
            </div>
          ) : news.length === 0 ? (
            <div className="noticias-v1-empty">
              <div className="noticias-v1-empty-icon">
                <Inbox size={48} />
              </div>
              <h3>No se encontraron noticias</h3>
              <p>No hay resultados con los filtros actuales.</p>

              <button
                className="noticias-v1-btn-empty"
                onClick={clearFilters}
              >
                <FilterX size={18} />
                Limpiar filtros
              </button>
            </div>
          ) : (
            <div className="noticias-v1-grid fade-in">
              {news.map(n => (
                <NoticiasCard key={n.id} news={n} />
              ))}
            </div>
          )}

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="noticias-v1-pagination">
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

export default Noticias;