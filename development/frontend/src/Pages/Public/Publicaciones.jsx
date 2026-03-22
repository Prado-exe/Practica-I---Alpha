// src/Pages/Publicaciones.jsx
import { useState, useEffect } from "react";
import Breadcrumb from "../../Components/Common/Breadcrumb";
import SearchBarAdvanced from "../../Components/Common/SearchBarAdvanced";
import Pagination from "../../Components/Common/Pagination";
import PublicationCard from "../../Components/Publicaciones/PublicationCard";
import AccordionFilter from "../../Components/Common/AccordionFilter";
import { getPublications } from "../../Services/PublicacionesService";
import "../../Styles/Pages_styles/Public/Publicaciones.css";

function Publicaciones() {

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [appliedFilters, setAppliedFilters] = useState({});
  const [publicationsData, setPublicationsData] = useState({
    data: [],
    total: 0,
    totalPages: 1
  });

  const publicationsPerPage = 7;

  // 🔧 CONFIGURACIÓN DE FILTROS
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

  // 🔁 reset página
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, appliedFilters]);

  // 🎯 filtros
  const handleFilterChange = (key, values) => {
    setAppliedFilters(prev => ({
      ...prev,
      [key]: values
    }));
  };

  const clearFilters = () => {
    setAppliedFilters({});
    setSearchQuery("");
  };

  // 📡 fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        const formattedFilters = Object.fromEntries(
          Object.entries(appliedFilters).map(([k, v]) => [k, v.join(",")])
        );

        const res = await getPublications({
          search: searchQuery,
          filters: formattedFilters,
          page: currentPage,
          limit: publicationsPerPage
        });

        if (currentPage > res.totalPages && res.totalPages > 0) {
          setCurrentPage(1);
        } else {
          setPublicationsData(res);
        }

      } catch (err) {
        console.error("Error cargando publicaciones", err);
      }
    };

    fetchData();
  }, [searchQuery, appliedFilters, currentPage]);

  return (
    <main className="publications-page">

      <Breadcrumb />

      <div className="publications-container">

        {/* 🔹 FILTROS */}
        <aside className="publications-filters">
          <AccordionFilter
            filters={filtersConfig}
            selectedFilters={appliedFilters}
            onChange={handleFilterChange}
            onClear={clearFilters}
          />
        </aside>

        {/* 🔹 RESULTADOS */}
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

          {/* 🔹 LISTADO */}
          <div className="publications-list">
            {publicationsData.data.length === 0 ? (
              <p>No se encontraron publicaciones</p>
            ) : (
              publicationsData.data.map(pub => (
                <PublicationCard key={pub.id} publication={pub} />
              ))
            )}
          </div>

          {/* 🔹 PAGINACIÓN */}
          {publicationsData.totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={publicationsData.totalPages}
              onPageChange={setCurrentPage}
            />
          )}

        </section>
      </div>
    </main>
  );
}

export default Publicaciones;