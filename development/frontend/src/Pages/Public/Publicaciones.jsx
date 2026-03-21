// src/Pages/Publicaciones.jsx
import { useState, useEffect } from "react";
import Breadcrumb from "../../Components/Common/Breadcrumb";
import SearchBarAdvanced from "../../Components/Common/SearchBarAdvanced";
import Pagination from "../../Components/Common/Pagination";
import PublicationCard from "../../Components/Publicaciones/PublicationCard";
import AccordionFilter from "../../Components/Publicaciones/AccordionFilterPub";
import { getPublications } from "../../Services/PublicacionesService";
import "../../Styles/Pages_styles/Public/Publicaciones.css";

function Publicaciones() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [publicationsData, setPublicationsData] = useState({
    data: [], total: 0, totalPages: 1
  });

  const publicationsPerPage = 7;

  // 🔹 reset currentPage al cambiar búsqueda o filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedTypes, selectedYears]);

  // 🔹 fetch data
  useEffect(() => {
    const fetchData = async () => {
      const res = await getPublications({
        search: searchQuery,
        filters: { type: selectedTypes, year: selectedYears },
        page: currentPage,
        limit: publicationsPerPage
      });

      if (currentPage > res.totalPages && res.totalPages > 0) {
        setCurrentPage(1);
      } else {
        setPublicationsData(res);
      }
    };
    fetchData();
  }, [searchQuery, selectedTypes, selectedYears, currentPage]);

  const toggleType = (type) => {
    setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const toggleYear = (year) => {
    setSelectedYears(prev => prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]);
  };

  const clearFilters = () => {
    setSelectedTypes([]);
    setSelectedYears([]);
    setSearchQuery("");
  };

  return (
    <main className="publications-page">
      <Breadcrumb />

      <div className="publications-container">
        <aside className="filters-panel">
          <h3 className="filters-title">Filtros</h3>

          <AccordionFilter
            title="Tipo de publicación"
            options={["Artículo", "Informe", "Estudio"]}
            selected={selectedTypes}
            onChange={toggleType}
          />

          <AccordionFilter
            title="Año"
            options={["2025", "2024", "2023", "2022"]}
            selected={selectedYears}
            onChange={toggleYear}
          />

          <div className="filters-actions">
            <button className="clear-filters-btn" onClick={clearFilters}>
              Limpiar filtros
            </button>
          </div>
        </aside>

        <section className="publications-results">
          <SearchBarAdvanced
            placeholder="Buscar publicaciones..."
            onSearch={(query) => setSearchQuery(query)}
          />

          <p className="publications-count">
            Mostrando <strong>
              {publicationsData.total === 0
                ? 0
                : (currentPage - 1) * publicationsPerPage + 1}-
              {Math.min(currentPage * publicationsPerPage, publicationsData.total)}
            </strong> de <strong>{publicationsData.total}</strong> publicaciones
          </p>

          <div className="publications-list">
            {publicationsData.data.map(pub => (
              <PublicationCard key={pub.id} publication={pub} />
            ))}
          </div>

          {publicationsData.totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={publicationsData.totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          )}
        </section>
      </div>
    </main>
  );
}

export default Publicaciones;