import { useState, useEffect } from "react";
import "../../Styles/Pages_styles/Public/Noticias.css";
import Breadcrumb from "../../Components/Common/Breadcrumb";
import SearchBarAdvanced from "../../Components/Common/SearchBarAdvanced";
import Pagination from "../../Components/Common/Pagination";
import NoticiasCard from "../../Components/Cards/NoticiasCard";
import AccordionFilter from "../../Components/Common/AccordionFilter";
import { useFetchList } from "../../Components/Hooks/useFetchList";
import { getNoticias, getNewsCategories } from "../../Services/NoticiasService";

function Noticias() {
  const [dbCategories, setDbCategories] = useState([]);
  const {
    search, setSearch, filters, setFilters, page, setPage,
    data: news, totalResults, loading, totalPages
  } = useFetchList(getNoticias, { limit: 7 });

  // 📡 Cargar categorías maestras de la tabla news_categories
  useEffect(() => {
    getNewsCategories().then(cats => {
      // Transformamos al formato {label, value} que pide tu Accordion
      setDbCategories(cats.map(c => ({ label: c.name, value: c.name })));
    });
  }, []);

  const availableYears = [...new Set(news.map(n => n.date ? new Date(n.date).getFullYear().toString() : null))]
    .filter(Boolean).sort((a,b) => b - a)
    .map(y => ({ label: y, value: y }));

  
  const filtersConfig = [
    {
      key: "category",
      title: "Categoría",
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
    <main className="news-page">
      <Breadcrumb paths={["Inicio", "Noticias"]} />
      <div className="news-container">
        <aside className="news-sidebar">
          <AccordionFilter
            filters={filtersConfig}
            selectedFilters={filters}
            onChange={handleFilterChange}
            onClear={clearFilters}
          />
        </aside>

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

          {loading ? (
            <p>Cargando noticias...</p>
          ) : news.length === 0 ? (
            <p>No se encontraron noticias</p>
          ) : (
            <>
              <p className="news-count">
                Mostrando <strong>{(page - 1) * 7 + 1}-{Math.min(page * 7, totalResults)}</strong> de <strong>{totalResults}</strong>
              </p>

              <div className="news-list">
                {news.map(n => <NoticiasCard key={n.id} news={n} />)}
              </div>
            </>
          )}

          {totalPages > 1 && (
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </section>
      </div>
    </main>
  );
}

export default Noticias;