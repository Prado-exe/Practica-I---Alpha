import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";
import { getMensajeById, eliminarMensajeContacto } from "../../Services/ContactoService";
import "../../Styles/Pages_styles/Admin/ContactoAdmin.css";

function ContactoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mensaje, setMensaje] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      const data = await getMensajeById(id, user?.token);
      if (data) setMensaje(data);
    };
    if (user?.token) cargar();
  }, [id, user?.token]);

  const borrar = async () => {
    if (!window.confirm("¿Eliminar definitivamente?")) return;
    if (await eliminarMensajeContacto(mensaje.id, user?.token)) {
      navigate("/administracion/contacto");
    }
  };

  if (!mensaje) return <p>Cargando...</p>;

  return (
    <div className="contacto-admin-container">
      <Link to="/administracion/contacto" className="btn-volver"> ⬅ Volver a la lista </Link>
      
      <div className="mensaje-detalle-card fade-in">
        <div className="detalle-header">
          <h2>Detalle de Mensaje</h2>
          <button onClick={borrar} className="btn-eliminar-red"> 🗑️ Eliminar </button>
        </div>

        <div className="info-grid">
          <div className="info-item"><label>De</label><p>{mensaje.name}</p></div>
          <div className="info-item"><label>Email</label><p>{mensaje.email}</p></div>
          <div className="info-item"><label>Categoría</label><p>{mensaje.category}</p></div>
          <div className="info-item"><label>Motivo</label><p>{mensaje.reason}</p></div>
          <div className="info-item"><label>Fecha</label><p>{new Date(mensaje.created_at).toLocaleString()}</p></div>
        </div>

        <label style={{fontWeight:'bold', color:'#888', fontSize:'12px'}}>MENSAJE:</label>
        <div className="mensaje-cuerpo">
          {mensaje.message}
        </div>
      </div>
    </div>
  );
}

export default ContactoDetalle;