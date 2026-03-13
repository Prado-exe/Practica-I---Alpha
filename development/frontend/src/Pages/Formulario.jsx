import { Link } from "react-router-dom";
import { useState } from "react";
import "../Styles/Pages_styles/Formulario.css";

function Formulario() {

  const maxChars = 3000;
  const [mensaje, setMensaje] = useState("");
  const [fileName, setFileName] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const handleMessage = (e) => {
    if (e.target.value.length <= maxChars) {
      setMensaje(e.target.value);
    }
  };

  const handleFile = (file) => {
  if (file) {
    setFileName(file.name);
  }
};

const handleDrop = (e) => {
  e.preventDefault();
  setDragActive(false);
  handleFile(e.dataTransfer.files[0]);
};

const handleDrag = (e) => {
  e.preventDefault();
  setDragActive(true);
};

const handleLeave = () => {
  setDragActive(false);
};

  return (
    <main className="form-page">

      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <Link to="/">Home</Link>
        <span> &gt; </span>
        <span>Formulario</span>
      </nav>

      {/* Encabezado */}
      <header className="form-header">
        <h1>Formulario de contacto</h1>
        <p>
          Complete el siguiente formulario para ponerse en contacto con
          nosotros. La información proporcionada nos ayudará a responder su
          solicitud de forma eficiente.
        </p>
      </header>

      <div className="form-progress">
        <div className="step active">
          <span>1</span>
          <p>Información</p>
        </div>

        <div className="progress-line"></div>

        <div className="step active">
          <span>2</span>
          <p>Consulta</p>
        </div>

        <div className="progress-line"></div>

        <div className="step">
          <span>3</span>
          <p>Enviar</p>
        </div>

      </div>

      <form className="form-container">

        {/* PASO 1 */}
        <section className="form-section">
          <h2>Paso 1: Información del usuario</h2>

          <div className="form-grid">

            <div className="form-group">
              <label htmlFor="nombre">Nombre</label>
              <input id="nombre" type="text" required />
            </div>

            <div className="form-group">
              <label htmlFor="apellido">Apellido</label>
              <input id="apellido" type="text" required />
            </div>

            <div className="form-group">
              <label htmlFor="correo">Correo electrónico</label>
              <input id="correo" type="email" required />
            </div>

            <div className="form-group">
              <label htmlFor="categoria">Categoría de usuario</label>
              <select id="categoria" required>
                <option value="">Seleccione una categoría</option>
                <option>Usuario estándar</option>
                <option>Institución</option>
                <option>No registrado</option>
              </select>
            </div>

          </div>
        </section>

        {/* PASO 2 */}
        <section className="form-section">
          <h2>Paso 2: Motivo de consulta</h2>

          <div className="form-group">
            <label htmlFor="motivo">Motivo de consulta</label>
            <select id="motivo">
              <option value="">Seleccione una opción</option>
              <option>Opción 1</option>
              <option>Opción 2</option>
              <option>Opción 3</option>
            </select>
          </div>

          <p className="form-helper">
            Esto nos permitirá derivar su consulta eficientemente.
          </p>

          {/* MENSAJE */}
          <div className="form-group">
            <label htmlFor="mensaje">Mensaje</label>

            <textarea
              id="mensaje"
              value={mensaje}
              onChange={handleMessage}
              placeholder="Escriba su mensaje..."
            />

            <div className="char-counter">
              Caracteres restantes: {maxChars - mensaje.length}
            </div>
          </div>

          <div className="form-group">
            <label>Adjuntar archivo</label>

            <div
              className={`upload-box ${dragActive ? "drag" : ""}`}
              onDrop={handleDrop}
              onDragOver={handleDrag}
              onDragLeave={handleLeave}
            >
              {fileName ? (
                <p>Archivo seleccionado: {fileName}</p>
              ) : (
                <p>Arrastre un archivo aquí o haga clic para subirlo</p>
              )}

              <input
                type="file"
                onChange={(e) => handleFile(e.target.files[0])}
              />
            </div>

          </div>

          {/* CAPTCHA */}
          <div className="form-group">
            <label htmlFor="captcha"></label>
            <input
              
            />
          </div>

        </section>

        <div className="form-buttons">

        <button
          type="reset"
          className="btn-secondary"
        >
          Limpiar formulario
        </button>

        <button
          type="submit"
          className="btn-primary"
        >
          Enviar formulario
        </button>

      </div>

      </form>

    </main>
  );
}

export default Formulario;