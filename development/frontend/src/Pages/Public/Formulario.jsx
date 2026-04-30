import { useState } from "react";
import "../../Styles/Pages_styles/Public/Formulario.css";
import Breadcrumb from "../../Components/Common/Breadcrumb";
import { enviarMensajeContacto } from "../../Services/ContactoService";

function Formulario() {
  const [loading, setLoading] = useState(false);
  const [mensajeExito, setMensajeExito] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    category: "",
    reason: "",
    message: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const clearForm = () => {
    setForm({ name: "", email: "", category: "", reason: "", message: "" });
    setMensajeExito("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensajeExito("");

    const response = await enviarMensajeContacto(form);

    if (response.ok) {
      setMensajeExito("¡Su mensaje ha sido enviado correctamente! Nos pondremos en contacto pronto.");
      setForm({ name: "", email: "", category: "", reason: "", message: "" });
    } else {
      alert(response.message); // Muestra el error exacto que envía el backend
    }
    
    setLoading(false);
  };

  return (
    <div className="contact-page">
      <Breadcrumb paths={["Inicio", "Contacto"]} />

      <header className="contact-header">
        <h1>Formulario de contacto</h1>
        <p>Complete el siguiente formulario para ponerse en contacto con nosotros.</p>
      </header>

      <form className="contact-form" onSubmit={handleSubmit}>
        {/* PASO 1 */}
        <div className="step-container">
          <div className="step-header">
            <div className="step-number">1</div>
            <div>
              <h2>Paso 1</h2>
              <p>Información de contacto</p>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Nombre y apellido *</label>
              <input type="text" name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Dirección de correo *</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <label>Categoría de usuario *</label>
            <select name="category" value={form.category} onChange={handleChange} required>
              <option value="">Seleccione una categoría</option>
              <option>Ciudadano</option>
              <option>Investigador</option>
              <option>Institución pública</option>
              <option>Empresa</option>
            </select>
          </div>
        </div>

        {/* PASO 2 */}
        <div className="step-container">
          <div className="step-header">
            <div className="step-number">2</div>
            <div>
              <h2>Paso 2</h2>
              <p>Detalle de su consulta</p>
            </div>
          </div>

          <div className="form-group">
            <label>Motivo de consulta *</label>
            <select name="reason" value={form.reason} onChange={handleChange} required>
              <option value="">Seleccione un motivo</option>
              <option>Solicitud de información</option>
              <option>Problema con datos</option>
              <option>Consulta técnica</option>
              <option>Sugerencias</option>
              <option>Otro</option>
            </select>
          </div>

          <div className="form-group">
            <label>Mensaje *</label>
            <textarea name="message" rows="6" maxLength="3000" value={form.message} onChange={handleChange} required />
            <div className="char-counter">{3000 - form.message.length} caracteres restantes</div>
          </div>
        </div>

        {mensajeExito && <div style={{ color: "green", fontWeight: "bold", marginBottom: "15px", padding: "10px", background: "#e8f5e9", borderRadius: "5px" }}>{mensajeExito}</div>}

        {/* BOTONES */}
        <div className="form-buttons">
          <button type="button" className="clear-btn" onClick={clearForm} disabled={loading}>Limpiar formulario</button>
          <button type="submit" className="submit-btn" disabled={loading}>{loading ? "Enviando..." : "Enviar Mensaje"}</button>
        </div>
      </form>
    </div>
  );
}

export default Formulario;
