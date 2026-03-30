import { useEffect, useState } from "react";
import CanView from "../../Components/Common/CanView";
import { useAuth } from "../../Context/AuthContext";
import { FiSearch, FiEye, FiEdit, FiTrash2, FiPlusCircle } from "react-icons/fi";
import CrearInstitucion from "./CrearInstitucion"; 
import EditarInstitucion from "./EditarInstitucion"; 
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
    if(!window.confirm(`¿Estás seguro de que deseas eliminar permanentemente a ${nombre}?`)) return;
    
    try {
      const res = await fetch(`${API_URL}/api/instituciones/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if(res.ok) {
        alert("Institución eliminada con éxito.");
        fetchInstituciones();
      } else {
        const err = await res.json();
        alert(`Error: ${err.message || 'No se pudo eliminar'}`);
      }
    } catch(error) {
      console.error(error);
      alert("Error de red al intentar eliminar.");
    }
  };

  const handleChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });
  const handleClear = () => setFilters({ busqueda: "", tipo: "", estado: "" });

  const abrirModalDetalles = (inst) => {
    setInstitucionDetalle(inst);
    setModalDetallesOpen(true);
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

  const institucionesFiltradas = instituciones.filter(inst => 
    (inst.legal_name || "").toLowerCase().includes(filters.busqueda.toLowerCase()) &&
    (filters.tipo === "" || inst.institution_type === filters.tipo) &&
    (filters.estado === "" || inst.institution_status === filters.estado)
  );

  return (
    <div className="gestion-instituciones">
      
      <div className="header">
        <div className="header-info">
          <h1>Instituciones</h1>
          <p>Administra entidades responsables de datasets.</p>
        </div>
        <CanView requiredPermission="admin_general.manage">
          <button className="btn-create" onClick={() => setIsCreating(true)}>
            <FiPlusCircle size={18} /> Nueva Institución
          </button>
        </CanView>
      </div>

      <div className="filters-section">
        <div className="filters-row-top">
          <div className="input-wrapper search-wrapper">
            <label>Buscar</label>
            <div className="input-with-icon">
              <FiSearch className="icon" />
              <input type="text" name="busqueda" placeholder="Buscar por nombre" value={filters.busqueda} onChange={handleChange} />
            </div>
          </div>
          <div className="input-wrapper">
            <label>Tipo</label>
            <select name="tipo" value={filters.tipo} onChange={handleChange}>
              <option value="">Cualquier</option>
              <option value="Academica">Académica</option>
              <option value="Institución pública">Institución pública</option>
              <option value="Privada">Privada</option>
              <option value="ONG">ONG</option>
            </select>
          </div>
          <div className="input-wrapper">
            <label>Estado</label>
            <select name="estado" value={filters.estado} onChange={handleChange}>
              <option value="">Cualquier</option>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>
          <div className="filter-buttons">
            <button className="btn-aplicar" onClick={() => console.log("Filtrando localmente...")}>APLICAR</button>
            <button className="btn-limpiar" onClick={handleClear}>LIMPIAR</button>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Sigla</th>
              <th>Tipo</th>
              <th className="text-center">Datasets</th>
              <th className="text-center">Estado</th>
              <th className="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="text-center p-20">Cargando datos...</td></tr>
            ) : institucionesFiltradas.length === 0 ? (
              <tr><td colSpan="6" className="text-center p-20 text-muted">No hay instituciones registradas o que coincidan con la búsqueda.</td></tr>
            ) : (
              institucionesFiltradas.map((inst) => {
                const isActive = inst.institution_status === 'active';
                return (
                  <tr key={inst.institution_id || inst.id}>
                    <td>{inst.legal_name}</td>
                    <td>{inst.short_name || "-"}</td>
                    <td>{inst.institution_type}</td>
                    <td className="text-center">-</td>
                    <td className="text-center">
                      <span className={`estado-badge ${isActive ? 'activo' : 'inactivo'}`}>
                        {isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="acciones">
                      <FiEye className="action-icon" title="Ver detalles" onClick={() => abrirModalDetalles(inst)} />
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
    </div>
  );
}

export default GestionInstituciones;