import { useState, useEffect } from "react";
import "../../Styles/Pages_styles/Public/Instituciones.css";
import InstitucionCard from "../../Components/Instituciones/InstitucionCard";
import Breadcrumb from "../../Components/Common/Breadcrumb";
import Pagination from "../../Components/Common/Pagination";
import SearchBarAdvanced from "../../Components/Common/SearchBarAdvanced";
import { getInstituciones } from "../../Services/InstitucionesService";

function Instituciones() {
  const [paginaActual, setPaginaActual] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [instituciones, setInstituciones] = useState([]);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [total, setTotal] = useState(0);

  const elementosPorPagina = 9;

  // 🔹 handleSearch solo cambia la página si la búsqueda cambia
  const handleSearch = (query) => {
    if (query !== searchQuery) {
      setSearchQuery(query);
      setPaginaActual(1);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const response = await getInstituciones({
        search: searchQuery,
        page: paginaActual,
        limit: elementosPorPagina
      });

      setInstituciones(response.data);
      setTotalPaginas(response.totalPages);
      setTotal(response.total);
    };

    fetchData();
  }, [searchQuery, paginaActual]);

  return (
    <main className="instituciones-page">
      <Breadcrumb items={[{ label: "Inicio", link: "/" }, { label: "Instituciones" }]} />

      <SearchBarAdvanced
        placeholder="Buscar instituciones..."
        onSearch={handleSearch}
      />

      <header className="instituciones-header">
        <h1>Instituciones</h1>
        <p>
          Listado de instituciones disponibles{" "}
          <span className="instituciones-count">({total} encontradas)</span>
        </p>
        <hr className="searchbar-separator" />
      </header>

      <section className="instituciones-grid" role="list">
        {instituciones.length > 0 ? (
          instituciones.map(inst => (
            <InstitucionCard key={inst.id} institucion={inst} />
          ))
        ) : (
          <p className="no-results">No se encontraron instituciones</p>
        )}
      </section>

      {totalPaginas > 1 && (
        <Pagination
          currentPage={paginaActual}
          totalPages={totalPaginas}
          onPageChange={setPaginaActual}
        />
      )}
    </main>
  );
}

export default Instituciones;