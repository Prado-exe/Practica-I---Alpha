import "../Styles/Pages_styles/Publicaciones.css";
import Breadcrumb from "../Components/Common/Breadcrumb";
import SearchBarAdvanced from "../Components/Common/SearchBarAdvanced";
import Pagination from "../Components/Common/Pagination";
import { publicaciones } from "../data/publicaciones";
import { useState } from "react";

function Publicaciones() {

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const publicationsPerPage = 7;

  const handleSearch = (query) => {
    setSearchQuery(query.toLowerCase());
    setCurrentPage(1);
  };

  const toggleType = (type) => {
    setSelectedTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
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
    setSelectedTypes([]);
    setSelectedYears([]);
    setSearchQuery("");
    setCurrentPage(1);
  };

  const filteredPublications = publicaciones.filter((pub) => {

    const matchesSearch =
      pub.title.toLowerCase().includes(searchQuery) ||
      pub.description.toLowerCase().includes(searchQuery);

    const matchesType =
      selectedTypes.length === 0 ||
      selectedTypes.includes(pub.type);

    const pubYear = new Date(pub.date).getFullYear().toString();

    const matchesYear =
      selectedYears.length === 0 ||
      selectedYears.includes(pubYear);

    return matchesSearch && matchesType && matchesYear;

  });

  const totalPages = Math.ceil(filteredPublications.length / publicationsPerPage);

  const startIndex = (currentPage - 1) * publicationsPerPage;
  const endIndex = startIndex + publicationsPerPage;

  const currentPublications = filteredPublications.slice(startIndex, endIndex);

  const searchFilters = [
    { label: "Tipo", options: ["Artículo", "Informe", "Estudio"] }
  ];

  return (
    <main className="publications-page">

      <Breadcrumb />

      <div className="publications-container">

        {/* PANEL FILTROS */}
        <aside className="filters-panel">

          <h3 className="filters-title">Filtros</h3>

          <details className="filter-group" open>
            <summary>Tipo de publicación</summary>

            <div className="filter-content">

              {["Artículo","Informe","Estudio"].map((type) => (
                <label key={type}>
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(type)}
                    onChange={() => toggleType(type)}
                  />
                  {type}
                </label>
              ))}

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
        <section className="publications-results">

          <SearchBarAdvanced
            placeholder="Buscar publicaciones..."
            onSearch={handleSearch}
            filters={searchFilters}
          />

          <p className="publications-count">
            Mostrando{" "}
            <strong>
              {filteredPublications.length === 0
                ? 0
                : startIndex + 1}-{Math.min(endIndex, filteredPublications.length)}
            </strong>{" "}
            de <strong>{filteredPublications.length}</strong> publicaciones
          </p>

          <div className="publications-list">

            {currentPublications.map((pub) => (

              <article key={pub.id} className="publication-card">

                <div className="publication-content">

                  <h3>{pub.title}</h3>

                  <p className="publication-date">
                    {new Date(pub.date).toLocaleDateString()}
                  </p>

                  <p className="publication-author">
                    {pub.author}
                  </p>

                  <p>{pub.description}</p>

                  <div className="publication-meta">

                    <span className="tag">
                      {pub.type}
                    </span>

                    {pub.tags.map((tag, i) => (
                      <span key={i} className="tag">
                        {tag}
                      </span>
                    ))}

                  </div>

                  <div className="publication-footer">
                    <button className="publication-btn">
                      Ver publicación
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

export default Publicaciones;