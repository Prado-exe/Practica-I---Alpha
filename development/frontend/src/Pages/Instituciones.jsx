import { useState, useMemo } from "react";
import "../Styles/Pages_styles/Instituciones.css";
import { instituciones } from "../data/institucionesData";
import InstitucionCard from "../Components/Instituciones/InstitucionCard";
import Breadcrumb from "../Components/common/Breadcrumb";
import Pagination from "../Components/common/Pagination";
import SearchBarAdvanced from "../Components/Common/SearchBarAdvanced";

function Instituciones() {
  const [paginaActual, setPaginaActual] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const elementosPorPagina = 9;

  // 🔹 Función que actualiza searchQuery al buscar
  const handleSearch = (query, selectedFilters) => {
    setSearchQuery(query);
    console.log("Filtros seleccionados:", selectedFilters);
  };

  // 🔹 Filtrado de instituciones (simulación)
  const filteredInstituciones = useMemo(() => {
    return instituciones.filter(inst =>
      inst.nombre.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const totalPaginas = Math.ceil(filteredInstituciones.length / elementosPorPagina);
  const indiceFinal = paginaActual * elementosPorPagina;
  const indiceInicio = indiceFinal - elementosPorPagina;
  const institucionesActuales = filteredInstituciones.slice(indiceInicio, indiceFinal);

  return (
    <main className="instituciones-page">
      <Breadcrumb items={[{ label: "Inicio", link: "/" }, { label: "Instituciones" }]} />

      <SearchBarAdvanced
        placeholder="Buscar instituciones..."
        onSearch={handleSearch}
        filters={[
          { label: "Ordenar por", options: ["Nombre A-Z", "Nombre Z-A"] }
        ]}
      />

      {/* 🔹 Separador debajo de la searchbar */}
      <header className="instituciones-header">
        <h1>Instituciones</h1>
        <p>Listado de instituciones disponibles. <span className="instituciones-count">({filteredInstituciones.length} encontradas)</span></p>
        {/* 🔹 Separador debajo del título y descripción */}
        <hr className="searchbar-separator" />
      </header>

      <section className="instituciones-grid" aria-label="Listado de instituciones" role="list">
        {institucionesActuales.map(inst => (
          <InstitucionCard key={inst.id} institucion={inst} />
        ))}
      </section>

      <Pagination currentPage={paginaActual} totalPages={totalPaginas} onPageChange={setPaginaActual} />
    </main>
  );
}

export default Instituciones;