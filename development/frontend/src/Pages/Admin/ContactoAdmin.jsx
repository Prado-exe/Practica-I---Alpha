import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Mail, MailOpen, Trash2, Eye, Loader2 } from "lucide-react";
import { useAuth } from "../../Context/AuthContext";
import { getMensajesContacto, eliminarMensajeContacto } from "../../Services/ContactoService";
import "../../Styles/Pages_styles/Admin/ContactoAdmin.css"; 

function ContactoAdmin() {
  const { user } = useAuth();
  const [mensajes, setMensajes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroActivo, setFiltroActivo] = useState("unread");

  useEffect(() => {
    const fetchMensajes = async () => {
      setLoading(true);
      const data = await getMensajesContacto(user?.token);
      setMensajes(data);
      setLoading(false);
    };
    if (user?.token) fetchMensajes();
  }, [user?.token]);

  const eliminarMensaje = async (id) => {
    if (!window.confirm("¿Seguro que desea eliminar este mensaje de contacto?")) return;
    const exito = await eliminarMensajeContacto(id, user?.token);
    if (exito) {
      setMensajes(prev => prev.filter(m => m.id !== id));
    } else {
      alert("Error al eliminar el mensaje.");
    }
  };

  const mensajesFiltrados = mensajes.filter(m => 
    filtroActivo === "unread" ? m.is_read === false : m.is_read === true
  );

  return (
    <div className="gestion-datasets">
      {/* HEADER ALINEADO */}
      <div className="header">
        <div className="header-info">
          <h1>Bandeja de Contacto</h1>
          <p>Administra los mensajes recibidos desde el formulario público del observatorio.</p>
        </div>
      </div>

      {/* SECCIÓN DE FILTROS (TABS ESTILO DASHBOARD) */}
      <div className="filters-section">
        <div className="filter-actions" style={{ justifyContent: "flex-start", gap: "15px" }}>
          <button 
            className={`btn-aplicar ${filtroActivo === "unread" ? "" : "inactive-tab"}`}
            onClick={() => setFiltroActivo("unread")}
            style={{ background: filtroActivo === "unread" ? "#1a6bf0" : "#e2e8f0", color: filtroActivo === "unread" ? "white" : "#4a5568" }}
          >
            <Mail size={16} /> No Leídos ({mensajes.filter(m => !m.is_read).length})
          </button>
          
          <button 
            className="btn-create" 
            onClick={() => setFiltroActivo("read")}
            style={{ background: filtroActivo === "read" ? "#1a6bf0" : "#e2e8f0", color: filtroActivo === "read" ? "white" : "#4a5568" }}
          >
            <MailOpen size={16} /> Leídos ({mensajes.filter(m => m.is_read).length})
          </button>
        </div>
      </div>

      {/* CONTENEDOR DE TABLA ADMINISTRATIVA */}
      <div className="table-container">
        {loading ? (
          <div className="loading-state" style={{ padding: "40px", textAlign: "center" }}>
            <Loader2 className="spin" /> Cargando mensajes...
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Remitente</th>
                <th>Motivo</th>
                <th style={{ textAlign: 'center' }}>Categoría</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {mensajesFiltrados.length > 0 ? (
                mensajesFiltrados.map((m) => (
                  <tr key={m.id}>
                    <td style={{ fontWeight: !m.is_read ? "700" : "400" }}>
                      {new Date(m.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: !m.is_read ? "700" : "500" }}>{m.name}</span>
                        <small style={{ color: "#666" }}>{m.email}</small>
                      </div>
                    </td>
                    <td>{m.reason}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`estado-badge archived`}>
                        {m.category}
                      </span>
                    </td>
                    <td className="acciones">
                      <Link to={`/administracion/contacto/${m.id}`} title="Ver Detalle">
                        <Eye className="action-icon" size={20} />
                      </Link>
                      
                      {m.is_read && (
                        <Trash2 
                          className="action-icon btn-destruir-icon" 
                          size={20} 
                          title="Eliminar Mensaje"
                          onClick={() => eliminarMensaje(m.id)}
                        />
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", padding: "40px", color: "#757575" }}>
                    No hay mensajes disponibles en esta bandeja.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default ContactoAdmin;