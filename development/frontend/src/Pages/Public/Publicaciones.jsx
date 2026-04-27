// src/Pages/Publicaciones.jsx
import Breadcrumb from "../../Components/Common/Breadcrumb";
import SearchBarAdvanced from "../../Components/Common/SearchBarAdvanced";
import Pagination from "../../Components/Common/Pagination";
import AccordionFilter from "../../Components/Common/AccordionFilter";
import PublicationCard from "../../Components/Cards/PublicationCard";
import { getPublications } from "../../Services/PublicacionesService";
import { useFetchList } from "../../Components/Hooks/useFetchList";
import "../../Styles/Pages_styles/Public/Publicaciones.css";

function Publicaciones() {
  const {
    search,
    setSearch,
    filters,
    setFilters,
    page,
    setPage,
    data: publications,
    totalPages,
    totalResults,
    loading
  } = useFetchList(getPublications, { limit: 7 });

  const filtersConfig = [
    {
      key: "type",
      title: "Tipo de publicación",
      options: ["Artículo", "Informe", "Estudio"],
      defaultOpen: true
    },
    {
      key: "year",
      title: "Año",
      options: ["2025", "2024", "2023", "2022"]
    }
  ];

  const handleFilterChange = (key, values) => {
    setFilters(prev => ({ ...prev, [key]: values }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearch("");
  };

  return (
    <main className="publications-page">
      <Breadcrumb paths={["Inicio", "Publicaciones"]} />

      <div className="publications-container">

        {/* 🔹 SIDEBAR */}
        <aside className="publications-filters">
          <AccordionFilter
            filters={filtersConfig}
            selectedFilters={filters}
            onChange={handleFilterChange}
            onClear={clearFilters}
          />
        </aside>

        {/* 🔹 CONTENIDO */}
        <section className="publications-results">

          {/* BUSCADOR */}
          <SearchBarAdvanced
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar publicaciones..."
          />

          {/* HEADER */}
          <div className="publications-header">
            <h1>Publicaciones</h1>
            <span>{totalResults} disponibles</span>
          </div>

          <hr className="publications-separator" />

          {/* CONTADOR */}
          <div className="publications-count">
            Mostrando{" "}
            <strong>
              {totalResults === 0
                ? 0
                : (page - 1) * 7 + 1}-
              {Math.min(page * 7, totalResults)}
            </strong>{" "}
            de <strong>{totalResults}</strong> publicaciones
          </div>

          {/* 🔥 CHIPS ACTIVOS */}
          {Object.entries(filters).some(([_, v]) => v?.length) && (
            <div className="publications-chips">
              {Object.entries(filters).map(([key, values]) =>
                values.map(value => (
                  <button
                    key={`${key}-${value}`}
                    className="chip"
                    onClick={() =>
                      handleFilterChange(
                        key,
                        values.filter(v => v !== value)
                      )
                    }
                  >
                    {value} ✕
                  </button>
                ))
              )}
            </div>
          )}

          <hr className="publications-separator" />

          {/* LISTADO */}
          <div className="publications-list">
            {loading ? (
              <div className="loading-state">Cargando publicaciones...</div>
            ) : publications.length === 0 ? (
              <div className="empty-state">No se encontraron publicaciones</div>
            ) : (
              publications.map(pub => (
                <PublicationCard key={pub.id} publication={pub} />
              ))
            )}
          </div>

          {/* PAGINACIÓN */}
          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          )}

        </section>
      </div>
    </main>
  );
}

export default Publicaciones;