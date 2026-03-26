import "../../Styles/Pages_styles/Public/Instituciones.css";
import InstitucionCard from "../../Components/Cards/InstitucionCard";
import Breadcrumb from "../../Components/Common/Breadcrumb";
import Pagination from "../../Components/Common/Pagination";
import SearchBarAdvanced from "../../Components/Common/SearchBarAdvanced";
import { useFetchList } from "../../Components/Hooks/useFetchList";
import { getInstituciones } from "../../Services/InstitucionesService";

function Instituciones() {

  const {
    search,
    setSearch,
    page,
    setPage,
    data: instituciones,
    totalPages,
    totalResults,
    loading
  } = useFetchList(getInstituciones, { limit: 9 }); 

  return (
    <main className="instituciones-page">

      <Breadcrumb paths={["Inicio", "Instituciones"]} />

      {/* BUSCADOR */}
      <SearchBarAdvanced
        placeholder="Buscar instituciones..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* HEADER */}
      <header className="instituciones-header">
        <h1>Instituciones</h1>
        <span>{totalResults} encontradas</span>
      </header>

      <hr className="instituciones-separator" />

      {/* GRID */}
      <section className="instituciones-grid">

        {loading ? (
          <p className="loading-state">Cargando...</p>
        ) : instituciones.length === 0 ? (
          <p className="empty-state">No se encontraron instituciones</p>
        ) : (
          instituciones.map(inst => (
            <InstitucionCard key={inst.id} institucion={inst} />
          ))
        )}

      </section>

      {/* PAGINACIÓN */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

    </main>
  );
}

export default Instituciones;