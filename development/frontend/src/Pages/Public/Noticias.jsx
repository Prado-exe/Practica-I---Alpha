import "../../Styles/Pages_styles/Public/Noticias.css"
import Breadcrumb from "../../Components/Common/Breadcrumb";
import SearchBarAdvanced from "../../Components/Common/SearchBarAdvanced";
import Pagination from "../../Components/Common/Pagination";
import { noticias } from "../../data/noticias";
import { useState, useEffect } from "react";
import AccordionFilterNot from "../../Components/Noticias/AccordionFilterNot";
import NoticiasCard from "../../Components/Noticias/NoticiasCard";
import { filterNews, paginate } from "../../Services/NoticiasService";

function Noticias() {

  // 🔎 búsqueda
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // 📄 paginación
  const [currentPage, setCurrentPage] = useState(1);

  // 🎯 filtros
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);

  const newsPerPage = 7;

  // 🔥 debounce
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchTerm]);

  // 🔥 reset página cuando cambian filtros o búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedCategories, selectedYears]);

  // 🎯 filtros
  const toggleCategory = (cat) => {
    setSelectedCategories(prev =>
      prev.includes(cat)
        ? prev.filter(c => c !== cat)
        : [...prev, cat]
    );
  };

  const toggleYear = (year) => {
    setSelectedYears(prev =>
      prev.includes(year)
        ? prev.filter(y => y !== year)
        : [...prev, year]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedYears([]);
    setSearchTerm("");
  };

  // 🔍 filtrar + paginar
  const filteredNews = filterNews(noticias, {
    searchQuery: debouncedSearch,
    selectedCategories,
    selectedYears
  });

  const {
    currentItems: currentNews,
    totalPages,
    startIndex,
    endIndex
  } = paginate(filteredNews, currentPage, newsPerPage);

  return (
    <main className="news-page">

      <Breadcrumb />

      <div className="news-container">

        {/* ========================
            FILTROS (IZQUIERDA)
        ======================== */}
        <aside className="news-filters">
          <AccordionFilterNot
            selectedCategories={selectedCategories}
            toggleCategory={toggleCategory}
            selectedYears={selectedYears}
            toggleYear={toggleYear}
            clearFilters={clearFilters}
          />
        </aside>

        {/* ========================
            CONTENIDO (DERECHA)
        ======================== */}
        <section className="news-main">

          {/* 🔎 BUSCADOR */}
          <SearchBarAdvanced
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar noticias..."
          />

          {/* 🧾 HEADER */}
          <div className="news-header">
            <h1>Noticias</h1>
            <p>{filteredNews.length} resultados</p>
          </div>

          <hr className="news-separator" />

          {/* 🏷️ FILTROS ACTIVOS */}
          <div className="applied-filters">
            {selectedCategories.map(cat => (
              <span
                key={cat}
                className="filter-chip"
                onClick={() => toggleCategory(cat)}
              >
                {cat} ✕
              </span>
            ))}

            {selectedYears.map(year => (
              <span
                key={year}
                className="filter-chip"
                onClick={() => toggleYear(year)}
              >
                {year} ✕
              </span>
            ))}
          </div>

          {/* 📊 RESULTADOS */}
          {filteredNews.length === 0 ? (
            <p className="no-results">No se encontraron noticias</p>
          ) : (
            <>
              <p className="news-count">
                Mostrando{" "}
                <strong>
                  {startIndex + 1}-{Math.min(endIndex, filteredNews.length)}
                </strong>{" "}
                de <strong>{filteredNews.length}</strong> noticias
              </p>

              <div className="news-list">
                {currentNews.map(news => (
                  <NoticiasCard key={news.id} news={news} />
                ))}
              </div>
            </>
          )}

          {/* 📄 PAGINACIÓN */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}

        </section>
      </div>
    </main>
  );
}

export default Noticias;