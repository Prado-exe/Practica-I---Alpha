import { Link } from "react-router-dom";
import { useState } from "react";
import "../../Styles/Pages_styles/Public/Formulario.css"
import Breadcrumb from "../../Components/Common/Breadcrumb"

function Formulario() {

  const [dragActive, setDragActive] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    category: "",
    reason: "",
    message: "",
    file: null
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (files) {
      setForm({ ...form, file: files[0] });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setForm({ ...form, file: e.dataTransfer.files[0] });
    }
  };

  const clearForm = () => {
    setForm({
      name: "",
      email: "",
      category: "",
      reason: "",
      message: "",
      file: null
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(form);
  };

  return (
    <div className="contact-page">

      <Breadcrumb />

      <header className="contact-header">
        <h1>Formulario de contacto</h1>
        <p>
          Complete el siguiente formulario para ponerse en contacto con nosotros.
          La información proporcionada nos ayudará a responder su solicitud de
          forma eficiente.
        </p>
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
              <label>Nombre y apellido</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Dirección de correo</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
              />
            </div>

          </div>

          <div className="form-group">
            <label>Categoría de usuario</label>

            <select
              name="category"
              value={form.category}
              onChange={handleChange}
            >
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

            <label>Motivo de consulta</label>

            <select
              name="reason"
              value={form.reason}
              onChange={handleChange}
            >
              <option value="">Seleccione un motivo</option>
              <option>Solicitud de información</option>
              <option>Problema con datos</option>
              <option>Consulta técnica</option>
              <option>Sugerencias</option>
              <option>Otro</option>
            </select>

            <small>
              Esto nos permitirá derivar su consulta al área correspondiente.
            </small>

          </div>

          <div className="form-group">

            <label>Mensaje</label>

            <textarea
              name="message"
              rows="6"
              maxLength="3000"
              value={form.message}
              onChange={handleChange}
            />

            <div className="char-counter">
              {3000 - form.message.length} caracteres restantes
            </div>

          </div>

          <div className="form-group">

            <label>Adjuntar archivo</label>

            <div
              className={`file-dropzone ${dragActive ? "active" : ""}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >

              <input
                type="file"
                id="fileUpload"
                className="file-input"
                onChange={handleChange}
              />

              {!form.file ? (
                <label htmlFor="fileUpload" className="file-label">
                  <div className="file-icon">📎</div>
                  <span>Arrastre su archivo aquí</span>
                  <p>o haga clic para seleccionarlo</p>
                </label>
              ) : (
                <div className="file-preview">
                  <span>{form.file.name}</span>

                  <button
                    type="button"
                    onClick={() => setForm({ ...form, file: null })}
                  >
                    eliminar
                  </button>
                </div>
              )}

            </div>

          </div>

        </div>

        {/* BOTONES */}

        <div className="form-buttons">

          <button
            type="button"
            className="clear-btn"
            onClick={clearForm}
          >
            Limpiar formulario
          </button>

          <button
            type="submit"
            className="submit-btn"
          >
            Enviar
          </button>

        </div>

      </form>

    </div>
  );
}

export default Formulario;
