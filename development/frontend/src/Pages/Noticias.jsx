import "../Styles/Pages_styles/Noticias.css";
import Breadcrumb from "../Components/Common/Breadcrumb";
import SearchBarAdvanced from "../Components/Common/SearchBarAdvanced";
import Pagination from "../Components/Common/Pagination";
import { noticias } from "../data/noticias";
import { useState } from "react";

function Noticias() {

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const newsPerPage = 7;

  const handleSearch = (query) => {
    setSearchQuery(query.toLowerCase());
    setCurrentPage(1);
  };

  const toggleCategory = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
    setCurrentPage(1);
  };

  const toggleYear = (year) => {
    setSelectedYears((prev) =>
      prev.includes(year)
        ? prev.filter((y) => y !== year)
        : [...prev, year]
    );
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedYears([]);
    setSearchQuery("");
    setCurrentPage(1);
  };

  const filteredNews = noticias.filter((news) => {

    const matchesSearch =
      news.title.toLowerCase().includes(searchQuery) ||
      news.description.toLowerCase().includes(searchQuery);

    const matchesCategory =
      selectedCategories.length === 0 ||
      selectedCategories.includes(news.category);

    const newsYear = new Date(news.date).getFullYear().toString();

    const matchesYear =
      selectedYears.length === 0 ||
      selectedYears.includes(newsYear);

    return matchesSearch && matchesCategory && matchesYear;

  });

  const totalPages = Math.ceil(filteredNews.length / newsPerPage);

  const startIndex = (currentPage - 1) * newsPerPage;
  const endIndex = startIndex + newsPerPage;

  const currentNews = filteredNews.slice(startIndex, endIndex);

  const searchFilters = [
    { label: "Categoría", options: ["Tecnología", "Sociedad", "Medio Ambiente"] }
  ];

  return (
    <main className="news-page">

      <Breadcrumb />

      <div className="news-container">

        {/* PANEL FILTROS */}
        <aside className="filters-panel">

          <h3 className="filters-title">Filtros</h3>

          <details className="filter-group" open>
            <summary>Categorías</summary>

            <div className="filter-content">

              <label>
                <input
                  type="checkbox"
                  checked={selectedCategories.includes("Tecnología")}
                  onChange={() => toggleCategory("Tecnología")}
                />
                Tecnología
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={selectedCategories.includes("Sociedad")}
                  onChange={() => toggleCategory("Sociedad")}
                />
                Sociedad
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={selectedCategories.includes("Medio Ambiente")}
                  onChange={() => toggleCategory("Medio Ambiente")}
                />
                Medio Ambiente
              </label>

            </div>
          </details>

          <details className="filter-group">
            <summary>Año</summary>

            <div className="filter-content">

              {["2025","2024","2023","2022"].map((year) => (
                <label key={year}>
                  <input
                    type="checkbox"
                    checked={selectedYears.includes(year)}
                    onChange={() => toggleYear(year)}
                  />
                  {year}
                </label>
              ))}

            </div>
          </details>

          <div className="filters-actions">
            <button
              className="clear-filters-btn"
              onClick={clearFilters}
            >
              Limpiar filtros
            </button>
          </div>

        </aside>

        {/* RESULTADOS */}
        <section className="news-results">

          <SearchBarAdvanced
            placeholder="Buscar noticias..."
            onSearch={handleSearch}
            filters={searchFilters}
          />

          <p className="news-count">
            Mostrando{" "}
            <strong>
              {filteredNews.length === 0
                ? 0
                : startIndex + 1}-{Math.min(endIndex, filteredNews.length)}
            </strong>{" "}
            de <strong>{filteredNews.length}</strong> noticias
          </p>

          <div className="news-list">

            {currentNews.map((news) => (

              <article key={news.id} className="news-card">

                <img
                  src={news.image}
                  alt={news.title}
                  className="news-image"
                />

                <div className="news-content">

                  <h3>{news.title}</h3>

                  <p className="news-date">
                    {new Date(news.date).toLocaleDateString()}
                  </p>

                  <p>{news.description}</p>

                  <div className="news-meta">

                    <span className="tag">
                      {news.category}
                    </span>

                    {news.tags.map((tag, i) => (
                      <span key={i} className="tag">
                        {tag}
                      </span>
                    ))}

                  </div>

                  <div className="news-footer">
                    <button className="news-btn">
                      Leer más
                    </button>
                  </div>

                </div>

              </article>

            ))}

          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />

        </section>

      </div>
    </main>
  );
}

export default Noticias;