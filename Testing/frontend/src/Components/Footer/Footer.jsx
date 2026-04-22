import "../../Styles/ComponentStyle/Footer/Footer.css"

//import de imagenes
import logoContent from "../../assets/content.png";
import logoUls from "../../assets/uls_logo.png";

function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-container">

        <div className="footer-grid">

          {/* Logos */}
          <div className="footer-logos">
            <img
              src={logoContent}
              alt="Logo del proyecto Content"
              loading="lazy"
              className="logo-main"
            />

            <img
              src={logoUls}
              alt="Logo Universidad de La Serena"
              loading="lazy"
              className="logo-uls"
            />
          </div>

          {/* Datos */}
          <nav
            className="footer-section"
            aria-labelledby="footer-datos"
          >
            <h4 id="footer-datos">Datos y contenidos</h4>

            <ul role="list">
              <li><a href="#">Datos</a></li>
              <li><a href="#">Instituciones</a></li>
              <li><a href="#">Indicadores</a></li>
              <li><a href="#">Publicaciones</a></li>
              <li><a href="#">Noticias</a></li>
            </ul>
          </nav>

          {/* Sobre nosotros */}
          <nav
            className="footer-section"
            aria-labelledby="footer-nosotros"
          >
            <h4 id="footer-nosotros">Sobre nosotros</h4>

            <ul role="list">
              <li><a href="#">Objetivo estratégico</a></li>
              <li><a href="#">Visión y misión</a></li>
              <li><a href="#">Principios</a></li>
              <li><a href="#">Metodología</a></li>
            </ul>
          </nav>

          {/* Contacto */}
          <nav
            className="footer-section"
            aria-labelledby="footer-contacto"
          >
            <h4 id="footer-contacto">Contacto</h4>

            <ul role="list">
              <li><a href="#">Formulario de contacto</a></li>
            </ul>
          </nav>

        </div>

        {/* Separador institucional */}
        <div className="footer-divider"></div>

        {/* copyright */}
        <div className="footer-bottom">
          <p>
            © 2026 Plataforma de Datos – Universidad de La Serena
          </p>
        </div>

      </div>
    </footer>
  );
}

export default Footer;


