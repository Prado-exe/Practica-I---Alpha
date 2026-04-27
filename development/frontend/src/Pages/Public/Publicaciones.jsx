import { useState, useEffect } from "react";
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
    search, setSearch, filters, setFilters, page, setPage,
    data: publications, totalPages, totalResults, loading
  } = useFetchList(getPublications, { limit: 7 });

  // 📡 Cargar categorías maestras generales (no de noticias)
  useEffect(() => {
    getCategories().then(cats => {
      setDbCategories(cats.map(c => ({ label: c.name, value: c.name })));
    });
  }, []);

  // Extraemos dinámicamente solo los años disponibles de las publicaciones
  const availableYears = [...new Set(publications.map(p => p.date ? new Date(p.date).getFullYear().toString() : null))]
    .filter(Boolean).sort((a,b) => b - a)
    .map(y => ({ label: y, value: y }));

  const filtersConfig = [
    {
      key: "type",
      title: "Tipo de publicación",
      options: dbCategories.length > 0 ? dbCategories : [{ label: "Cargando...", value: "" }],
      defaultOpen: true
    },
    {
      key: "year",
      title: "Año",
      options: availableYears
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
        <aside className="publications-filters">
          <AccordionFilter
            filters={filtersConfig}
            selectedFilters={filters}
            onChange={handleFilterChange}
            onClear={clearFilters}
          />
        </aside>

        <section className="publications-results">
          <SearchBarAdvanced
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar publicaciones..."
          />
          
          <header className="instituciones-header">
            <h1>Publicaciones</h1>
            <span>{totalResults} encontradas</span>
          </header>

          <p className="publications-count">
            Mostrando <strong>{totalResults === 0 ? 0 : (page - 1) * 7 + 1}-{Math.min(page * 7, totalResults)}</strong> de <strong>{totalResults}</strong> publicaciones
          </p>

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

          {totalPages > 1 && (
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </section>
      </div>
    </main>
  );
}

export default Publicaciones;