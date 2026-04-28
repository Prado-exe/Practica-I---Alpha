import { useEffect, useState } from "react";
import CanView from "../../Components/Common/CanView";
import { useAuth } from "../../Context/AuthContext";
import { FiSearch, FiEye, FiEdit, FiTrash2, FiPlusCircle, FiUsers } from "react-icons/fi";
import CrearInstitucion from "./CrearInstitucion"; 
import EditarInstitucion from "./EditarInstitucion"; 
import FichaInstitucion from "./FichaInstitucion"; // Importamos el nuevo componente
import "../../Styles/Pages_styles/Admin/GestionInstituciones.css";


const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function GestionInstituciones() {
  const { user } = useAuth();
  const [instituciones, setInstituciones] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({ busqueda: "", tipo: "", estado: "" });
  const [isCreating, setIsCreating] = useState(false);
  const [editingInstitution, setEditingInstitution] = useState(null); 
  const [modalDetallesOpen, setModalDetallesOpen] = useState(false);
  const [institucionDetalle, setInstitucionDetalle] = useState(null);
  const [modalMiembrosOpen, setModalMiembrosOpen] = useState(false);
  const [institucionMiembros, setInstitucionMiembros] = useState(null);
  const [miembrosLista, setMiembrosLista] = useState([]);
  const [loadingMiembros, setLoadingMiembros] = useState(false);

  useEffect(() => {
    if (user?.token) fetchInstituciones();
  }, [user?.token]);

  const fetchInstituciones = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/instituciones`, {
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInstituciones(data.instituciones || []);
      }
    } catch (error) {
      console.error("Error obteniendo instituciones:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id, nombre) => {
    const mensajeAlerta = `⚠️ ADVERTENCIA CRÍTICA\n\n¿Estás seguro de que deseas eliminar permanentemente a "${nombre}"?\n\nAl borrarla:\n1. Los usuarios vinculados quedarán sin institución.\n2. Los datasets asociados perderán su vínculo institucional.\n\nEsta acción no se puede deshacer.`;
    if(!window.confirm(mensajeAlerta)) return;
    
    try {
      const res = await fetch(`${API_URL}/api/instituciones/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if(res.ok) {
        alert("Institución eliminada con éxito.");
        fetchInstituciones();
      }
    } catch(error) {
      console.error(error);
    }
  };

  const handleChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });
  const handleClear = () => setFilters({ busqueda: "", tipo: "", estado: "" });

  const abrirModalDetalles = (inst) => {
    setInstitucionDetalle(inst);
    setModalDetallesOpen(true);
  };

  const abrirModalMiembros = async (inst) => {
    setInstitucionMiembros(inst);
    setModalMiembrosOpen(true);
    setLoadingMiembros(true);
    try {
      const res = await fetch(`${API_URL}/api/instituciones/${inst.institution_id || inst.id}/usuarios`, {
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (data.ok) setMiembrosLista(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMiembros(false);
    }
  };

  const handleDesvincular = async (usuarioId, nombre) => {
    const respuesta = window.prompt(`¿Desvincular a ${nombre}?\n\nEscribe "A" para solo quitar la institución.\nEscribe "B" para quitar institución Y degradarlo a Usuario Registrado.\nDejar vacío para cancelar.`);
    
    if (!respuesta) return;
    const opcion = respuesta.toUpperCase();
    if (opcion !== "A" && opcion !== "B") return alert("Opción no válida.");

    try {
      const res = await fetch(`${API_URL}/api/usuarios/${usuarioId}/desvincular`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${user.token}` },
        body: JSON.stringify({ degradeRole: opcion === "B" })
      });
      
      if (res.ok) {
        alert("Usuario desvinculado con éxito.");
        setMiembrosLista(miembrosLista.filter(m => m.id !== usuarioId)); // Quitar de la lista del modal
        fetchInstituciones(); // Actualizar el contador de la tabla principal
      } else {
        const err = await res.json();
        alert(err.message);
      }
    } catch(e) {
      console.error(e);
    }
  };

  if (isCreating) {
    return <CrearInstitucion onCancel={() => { setIsCreating(false); fetchInstituciones(); }} />;
  }

  if (editingInstitution) {
    return <EditarInstitucion 
      institucion={editingInstitution} 
      onCancel={() => { setEditingInstitution(null); fetchInstituciones(); }} 
    />;
  }

  if (viewingInstitution) {
    return <FichaInstitucion 
      institucion={viewingInstitution} 
      onBack={() => setViewingInstitution(null)} 
    />;
  }

  const institucionesFiltradas = instituciones.filter(inst => 
    (inst.legal_name || "").toLowerCase().includes(filters.busqueda.toLowerCase()) &&
    (filters.tipo === "" || inst.institution_type === filters.tipo) &&
    (filters.estado === "" || inst.institution_status === filters.estado)
  );

  return (
    <div className="ginstituciones-container">
      <div className="ginstituciones-header">
        <div className="ginstituciones-header-info">
          <h1>Gestión de Instituciones</h1>
          <p>Administra las entidades responsables y propietarios de los conjuntos de datos.</p>
        </div>
        <CanView requiredPermission="admin_general.manage">
          <button className="ginstituciones-btn-create" onClick={() => setIsCreating(true)}>
            <PlusCircle size={18} /> Nueva Institución
          </button>
        </CanView>
      </div>

      {/* ... (Sección de filtros se mantiene igual) ... */}

      <div className="ginstituciones-table-container">
        <table>
          <thead>
            <tr>
              <th>Nombre Legal</th>
              <th>Sigla</th>
              <th>Tipo de Entidad</th>
              <th style={{ textAlign: 'center' }}>Estado</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>Cargando instituciones...</td></tr>
            ) : institucionesFiltradas.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>No se encontraron instituciones.</td></tr>
            ) : (
              institucionesFiltradas.map((inst) => {
                const isActive = inst.institution_status === 'active';
                const id = inst.institution_id || inst.id;
                return (
                  <tr key={id}>
                    <td>{inst.legal_name}</td>
                    <td><span className="ginstituciones-sigla-tag">{inst.short_name || "-"}</span></td>
                    <td>{inst.institution_type}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`ginstituciones-badge ${isActive ? 'active' : 'inactive'}`}>
                        {isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="acciones">
                      <FiEye className="action-icon" title="Ver detalles" onClick={() => abrirModalDetalles(inst)} />
                      <FiUsers className="action-icon" style={{color: "#004e9a"}} title="Ver Miembros" onClick={() => abrirModalMiembros(inst)} />
                      <FiEdit className="action-icon" title="Editar" onClick={() => setEditingInstitution(inst)} />
                      <FiTrash2 className="action-icon" title="Eliminar" onClick={() => handleEliminar(inst.institution_id || inst.id, inst.legal_name)} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL DE DETALLES (ESTILO FICHA) */}
{modalDetallesOpen && institucionDetalle && (
  <div className="modal-overlay">
    <div className="modal-content-ficha">
      
      {/* Header */}
      <div className="modal-header-ficha">
        <h2 className="modal-title">Detalle de la Institucion</h2>
        <button onClick={() => setModalDetallesOpen(false)} className="modal-close">✕</button>
      </div>

      <div className="modal-body-ficha">
        
        {/* Logo Centrado */}
        <div className="logo-view-container">
          <img 
            src={institucionDetalle.logo_url || "/placeholder-logo.png"} 
            alt="Logo Institucional" 
            className="logo-view-img" 
          />
        </div>

        {/* Campos de información */}
        <div className="info-row">
          <span className="info-label">Nombre oficial :</span>
          <div className="info-value-box">{institucionDetalle.legal_name}</div>
        </div>

        <div className="info-row">
          <span className="info-label">Sigla/Acrónimo :</span>
          <div className="info-value-box">{institucionDetalle.short_name || "-"}</div>
        </div>

        <div className="info-row">
          <span className="info-label">Tipo :</span>
          <div className="info-value-box">{institucionDetalle.institution_type}</div>
        </div>

        <div className="info-row">
          <span className="info-label">Pais :</span>
          <div className="info-value-box">{institucionDetalle.country_name}</div>
        </div>

        <div className="info-row">
          <span className="info-label">Dependencia :</span>
          <div className="info-value-box">No Aplica</div>
        </div>

        <div className="info-row">
          <span className="info-label">Área temática :</span>
          <div className="info-value-box">{institucionDetalle.main_thematic_area || "-"}</div>
        </div>

        <div className="info-row">
          <span className="info-label">Rol :</span>
          <div className="info-value-box">{institucionDetalle.data_role}</div>
        </div>

        <div className="info-row">
          <span className="info-label">Miembros registrados :</span>
          <div className="info-value-box">
             {institucionDetalle.members_count ?? 0} usuarios asociados
          </div>
        </div>

        <div className="info-row">
          <span className="info-label">Licencia de uso :</span>
          <div className="info-value-box">{institucionDetalle.usage_license || "-"}</div>
        </div>

        {/* Descripción */}
        <div className="description-container">
          <span className="description-label">Descripcion</span>
          <div className="description-text-box">
            {institucionDetalle.description}
          </div>
        </div>

        {/* Estados con píldoras */}
        <div className="info-row" style={{ marginTop: '10px' }}>
          <span className="info-label">Nivel de acceso :</span>
          <span className="estado-badge activo" style={{ background: '#2d6cf0' }}>
            {institucionDetalle.access_level === 'public' ? 'Publico' : 'Interno'}
          </span>
        </div>

        <div className="info-row">
          <span className="info-label">Estado :</span>
          <span className={`estado-badge ${institucionDetalle.institution_status === 'active' ? 'activo' : 'inactivo'}`}>
            {institucionDetalle.institution_status === 'active' ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="modal-footer-ficha">
        <button onClick={() => setModalDetallesOpen(false)} className="btn-close-modal">
          Cerrar
        </button>
      </div>

    </div>
  </div>

  
)}
{/* MODAL DE MIEMBROS */}
      {modalMiembrosOpen && institucionMiembros && (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
          <div className="modal-content-ficha" style={{ maxWidth: "700px" }}>
            <div className="modal-header-ficha">
              <h2 className="modal-title">Miembros de {institucionMiembros.legal_name}</h2>
              <button onClick={() => setModalMiembrosOpen(false)} className="modal-close">✕</button>
            </div>

            <div className="modal-body-ficha" style={{ padding: "20px", overflowY: "auto", maxHeight: "60vh" }}>
              {loadingMiembros ? <p>Cargando miembros...</p> : miembrosLista.length === 0 ? (
                <p style={{ textAlign: "center", color: "#666", padding: "20px" }}>No hay usuarios vinculados a esta institución.</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #eee" }}>
                      <th style={{ padding: "10px" }}>Nombre</th>
                      <th>Email</th>
                      <th>Rol Actual</th>
                      <th style={{ textAlign: "center" }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {miembrosLista.map(m => (
                      <tr key={m.id} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={{ padding: "10px", fontWeight: "500", color: "#333" }}>{m.nombre}</td>
                        <td style={{ color: "#666" }}>{m.email}</td>
                        <td>
                          <span style={{ background: "#e8f0fe", color: "#1967d2", padding: "4px 8px", borderRadius: "4px", fontSize: "12px" }}>
                            {(m.rol || "").replace("_", " ")}
                          </span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <button onClick={() => handleDesvincular(m.id, m.nombre)} style={{ background: "#dc3545", color: "white", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>
                            Desvincular
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionInstituciones;