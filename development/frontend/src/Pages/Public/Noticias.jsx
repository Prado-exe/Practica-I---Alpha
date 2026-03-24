import "../../Styles/Pages_styles/Public/Noticias.css";
import Breadcrumb from "../../Components/Common/Breadcrumb";
import SearchBarAdvanced from "../../Components/Common/SearchBarAdvanced";
import Pagination from "../../Components/Common/Pagination";
import NoticiasCard from "../../Components/Cards/NoticiasCard";
import AccordionFilter from "../../Components/Common/AccordionFilter";
import { useFetchList } from "../../Components/Hooks/useFetchList";
import { getNoticias } from "../../Services/NoticiasService";

function Noticias() {

  const {
    search,
    setSearch,
    filters,
    setFilters,
    page,
    setPage,
    data: news,
    totalPages,
    totalResults,
    loading
  } = useFetchList(getNoticias, { limit: 7 });

  // 🔧 config filtros
  const filtersConfig = [
    {
      key: "category",
      title: "Categoría",
      options: ["Política", "Economía", "Tecnología"],
      defaultOpen: true
    },
    {
      key: "year",
      title: "Año",
      options: ["2025", "2024", "2023"]
    }
  ];

  const handleFilterChange = (key, values) => {
    setFilters(prev => ({
      ...prev,
      [key]: values
    }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearch("");
  };

  return (
    <main className="news-page">

      <Breadcrumb paths={["Inicio", "Noticias"]} />

      <div className="news-container">

        {/* FILTROS */}
        <aside className="news-sidebar">
          <AccordionFilter
            filters={filtersConfig}
            selectedFilters={filters}
            onChange={handleFilterChange}
            onClear={clearFilters}
          />
        </aside>

        {/* CONTENIDO */}
        <section className="news-content">

          <SearchBarAdvanced
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar noticias..."
          />

          <div className="news-header">
            <h1>Noticias</h1>
            <span>{totalResults} resultados</span>
          </div>

          <hr className="news-separator" />

          {/* RESULTADOS */}
          {loading ? (
            <p>Cargando noticias...</p>
          ) : news.length === 0 ? (
            <p>No se encontraron noticias</p>
          ) : (
            <>
              <p className="news-count">
                Mostrando{" "}
                <strong>
                  {(page - 1) * 7 + 1}-
                  {Math.min(page * 7, totalResults)}
                </strong>{" "}
                de <strong>{totalResults}</strong>
              </p>

              <div className="news-list">
                {news.map(n => (
                  <NoticiasCard key={n.id} news={n} />
                ))}
              </div>
            </>
          )}

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

export default Noticias;