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

  // Estados para el Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [institucionSeleccionada, setInstitucionSeleccionada] = useState(null);

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
      const response = await getInstituciones({
        search: searchQuery,
        page: paginaActual,
        limit: elementosPorPagina
      });

      setInstituciones(response.data || []);
      setTotalPaginas(response.totalPages || 1);
      setTotal(response.total || 0);
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
            <InstitucionCard 
              key={inst.institution_id} /* 👈 EL CAMBIO ESTÁ AQUÍ */
              institucion={inst} 
              onOpenModal={abrirModal} 
            />
          ))
        ) : (
          <p className="no-results">No se encontraron instituciones públicas.</p>
        )}
      </section>

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