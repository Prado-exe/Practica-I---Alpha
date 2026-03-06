import "../Styles/Component_styles/Footer.css";

function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-container">

        <div className="footer-grid">

          {/* Logos */}
          <div className="footer-logos">
            <img
              src="/src/assets/content.png"
              alt="Logo proyecto Content"
              className="logo-main"
            />

            <img
              src="/src/assets/uls_logo.png"
              alt="Logo Universidad de La Serena"
              className="logo-uls"
            />
          </div>

          {/* Datos */}
          <nav className="footer-section" aria-label="Datos y contenidos">
            <h4>Datos y contenidos</h4>
            <ul>
              <li><a href="#">Datos</a></li>
              <li><a href="#">Instituciones</a></li>
              <li><a href="#">Indicadores</a></li>
              <li><a href="#">Publicaciones</a></li>
              <li><a href="#">Noticias</a></li>
            </ul>
          </nav>

          {/* Sobre nosotros */}
          <nav className="footer-section" aria-label="Sobre nosotros">
            <h4>Sobre nosotros</h4>
            <ul>
              <li><a href="#">Objetivo estratégico</a></li>
              <li><a href="#">Visión y misión</a></li>
              <li><a href="#">Principios</a></li>
              <li><a href="#">Metodología</a></li>
            </ul>
          </nav>

          {/* Contacto */}
          <nav className="footer-section" aria-label="Contacto">
            <h4>Contacto</h4>
            <ul>
              <li><a href="#">Formulario de contacto</a></li>
            </ul>
          </nav>

        </div>

        <p className="footer-copy">
          © 2026 Plataforma de Datos – Todos los derechos reservados
        </p>

      </div>
    </footer>
  );
}

export default Footer;