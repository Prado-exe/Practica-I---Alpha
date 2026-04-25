import { useState, useEffect } from "react";
import "../../Styles/Pages_styles/Public/Instituciones.css";
import InstitucionCard from "../../Components/Cards/InstitucionCard";
import Breadcrumb from "../../Components/Common/Breadcrumb";
import Pagination from "../../Components/Common/Pagination";
import SearchBarAdvanced from "../../Components/Common/SearchBarAdvanced";
import { getInstituciones } from "../../Services/InstitucionesService";

function Instituciones() {
  const [searchQuery, setSearchQuery] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const [instituciones, setInstituciones] = useState([]);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const elementosPorPagina = 9;

  const handleSearch = (query) => {
    if (query !== searchQuery) {
      setSearchQuery(query);
      setPaginaActual(1);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const response = await getInstituciones({
        search: searchQuery,
        page: paginaActual,
        limit: elementosPorPagina
      });

      setInstituciones(response.data || []);
      setTotalPaginas(response.totalPages || 1);
      setTotal(response.total || 0);
      setLoading(false);
    };

    fetchData();
  }, [searchQuery, paginaActual]);

  return (
    <main className="instituciones-page">
      <Breadcrumb paths={["Inicio", "Instituciones"]} />

      <SearchBarAdvanced
        placeholder="Buscar instituciones..."
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
      />

      <header className="instituciones-header">
        <h1>Instituciones</h1>
        <span>{total} encontradas</span>
      </header>

      <hr className="instituciones-separator" />

      <section className="instituciones-grid">
        {loading ? (
          <p className="loading-state">Cargando...</p>
        ) : instituciones.length === 0 ? (
          <p className="empty-state">No se encontraron instituciones</p>
        ) : (
          instituciones.map(inst => (
            <InstitucionCard 
              key={inst.institution_id} 
              institucion={inst} 
              // Eliminamos onOpenModal, la tarjeta ahora debería usar <Link> internamente
            />
          ))
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