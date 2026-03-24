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
  // 🔹 hook genérico
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

  // 🔧 Configuración de filtros
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

        {/* 🔹 FILTROS */}
        <aside className="publications-filters">
          <AccordionFilter
            filters={filtersConfig}
            selectedFilters={filters}
            onChange={handleFilterChange}
            onClear={clearFilters}
          />
        </aside>

        {/* 🔹 RESULTADOS */}
        <section className="publications-results">

          <SearchBarAdvanced
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar publicaciones..."
          />
          
          {/* HEADER */}
          <header className="instituciones-header">
            <h1>Instituciones</h1>
            <span>{totalResults} encontradas</span>
          </header>

          {/* contador */}
          <p className="publications-count">
            Mostrando <strong>
              {totalResults === 0
                ? 0
                : (page - 1) * 7 + 1}-
              {Math.min(page * 7, totalResults)}
            </strong> de <strong>{totalResults}</strong> publicaciones
          </p>

          {/* LISTADO */}
          <div className="publications-list">
            {loading ? (
              <p>Cargando publicaciones...</p>
            ) : publications.length === 0 ? (
              <p>No se encontraron publicaciones</p>
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