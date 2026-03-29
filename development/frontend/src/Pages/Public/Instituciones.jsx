import { useState, useEffect } from "react"; // 👈 Importante añadir estos
import "../../Styles/Pages_styles/Public/Instituciones.css";
import InstitucionCard from "../../Components/Cards/InstitucionCard";
import Breadcrumb from "../../Components/Common/Breadcrumb";
import Pagination from "../../Components/Common/Pagination";
import SearchBarAdvanced from "../../Components/Common/SearchBarAdvanced";
import { useFetchList } from "../../Components/Hooks/useFetchList";
import { getInstituciones } from "../../Services/InstitucionesService";

function Instituciones() {

  /*const {
    search,
    setSearch,
    page,
    setPage,
    data: instituciones,
    totalPages,
    totalResults,
    loading
  } = useFetchList(getInstituciones, { limit: 9 }); 
  // Estados para el Modal/*/

  // --- ESTADOS (Asegúrate de tener estos definidos si no usas useFetchList) ---
  const [modalOpen, setModalOpen] = useState(false);
  const [institucionSeleccionada, setInstitucionSeleccionada] = useState(null);
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

  const abrirModal = (inst) => {
    setInstitucionSeleccionada(inst);
    setModalOpen(true);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); // Activar carga
      const response = await getInstituciones({
        search: searchQuery,
        page: paginaActual,
        limit: elementosPorPagina
      });

      setInstituciones(response.data || []);
      setTotalPaginas(response.totalPages || 1);
      setTotal(response.total || 0);
      setLoading(false); // Finalizar carga
    };

    fetchData();
  }, [searchQuery, paginaActual]);

  return (
    <main className="instituciones-page">

      <Breadcrumb paths={["Inicio", "Instituciones"]} />

      {/* BUSCADOR */}
      <SearchBarAdvanced
        placeholder="Buscar instituciones..."
        value={searchQuery} // 👈 Cambiado a searchQuery para coincidir con tu estado
        onChange={(e) => handleSearch(e.target.value)}
      />

      {/* HEADER */}
      <header className="instituciones-header">
        <h1>Instituciones</h1>
        <span>{total} encontradas</span>
      </header>

      <hr className="instituciones-separator" />

      {/* GRID - CORREGIDO AQUÍ */}
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
              onOpenModal={abrirModal} 
            />
          ))
        )}
      </section>

      {/* PAGINACIÓN */}
      {totalPaginas > 1 && (
        <Pagination
          currentPage={paginaActual}
          totalPages={totalPaginas}
          onPageChange={setPaginaActual}
        />
      )}

      {/* MODAL EMERGENTE PÚBLICO */}
      {modalOpen && institucionSeleccionada && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ background: "white", padding: "30px", borderRadius: "8px", width: "500px", maxWidth: "90%", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <img 
                src={institucionSeleccionada.logo_url} 
                alt="Logo" 
                style={{ width: "80px", height: "80px", objectFit: "contain", border: "1px solid #eee", borderRadius: "8px", padding: "5px" }} 
              />
              <button onClick={() => setModalOpen(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#666" }}>✕</button>
            </div>

            <h2 style={{ margin: "0 0 10px 0", color: "#0056b3" }}>{institucionSeleccionada.legal_name}</h2>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px", fontSize: "14px", color: "#444" }}>
              <p style={{ margin: 0 }}><strong>Sigla:</strong> {institucionSeleccionada.short_name || "-"}</p>
              <p style={{ margin: 0 }}><strong>País:</strong> {institucionSeleccionada.country_name}</p>
              <p style={{ margin: 0 }}><strong>Tipo:</strong> {institucionSeleccionada.institution_type}</p>
              <p style={{ margin: 0 }}><strong>Rol:</strong> {institucionSeleccionada.data_role}</p>
            </div>

            <h4 style={{ margin: "0 0 5px 0" }}>Descripción</h4>
            <p style={{ fontSize: "14px", color: "#555", lineHeight: "1.5", maxHeight: "150px", overflowY: "auto", margin: 0 }}>
              {institucionSeleccionada.description}
            </p>

          </div>
        </div>
      )}
    </main>
  );
}

export default Instituciones;