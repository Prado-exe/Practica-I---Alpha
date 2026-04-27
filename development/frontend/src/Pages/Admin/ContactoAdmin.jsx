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
    <div className="admin-page-container">
      <div className="admin-header-flex">
        <div>
          <h1 className="admin-title">Bandeja de Contacto</h1>
          <p className="admin-subtitle">Administra los mensajes recibidos desde el formulario público.</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button 
          onClick={() => setFiltroActivo("unread")}
          style={{ padding: "10px 20px", borderRadius: "6px", border: "none", cursor: "pointer", background: filtroActivo === "unread" ? "#004e9a" : "#e0e0e0", color: filtroActivo === "unread" ? "white" : "#333", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px" }}
        >
          <Mail size={18} /> No Leídos ({mensajes.filter(m => !m.is_read).length})
        </button>
        <button 
          onClick={() => setFiltroActivo("read")}
          style={{ padding: "10px 20px", borderRadius: "6px", border: "none", cursor: "pointer", background: filtroActivo === "read" ? "#28a745" : "#e0e0e0", color: filtroActivo === "read" ? "white" : "#333", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px" }}
        >
          <MailOpen size={18} /> Leídos ({mensajes.filter(m => m.is_read).length})
        </button>
      </div>

      <div className="admin-card fade-in">
        {loading ? (
           <div className="loading-state"><Loader2 className="spin" /> Cargando mensajes...</div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Remitente</th>
                  <th>Motivo</th>
                  <th>Categoría</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {mensajesFiltrados.length > 0 ? (
                  mensajesFiltrados.map((m) => (
                    <tr key={m.id} style={{ fontWeight: !m.is_read ? "bold" : "normal", background: !m.is_read ? "#f4f9ff" : "transparent" }}>
                      <td>{new Date(m.created_at).toLocaleDateString()}</td>
                      <td>
                        {m.name} <br/>
                        <small style={{ color: "#666", fontWeight: "normal" }}>{m.email}</small>
                      </td>
                      <td>{m.reason}</td>
                      <td><span className="badge draft">{m.category}</span></td>
                      <td className="actions-cell">
                        <Link to={`/administracion/contacto/${m.id}`} className="btn-icon" title="Ver detalle">
                          <Eye size={18} color="#004e9a" />
                        </Link>
                        {m.is_read && (
                          <button className="btn-icon delete" title="Borrar" onClick={() => eliminarMensaje(m.id)}>
                            <Trash2 size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "30px", color: "#666" }}>
                      No hay mensajes en esta bandeja.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ContactoAdmin;