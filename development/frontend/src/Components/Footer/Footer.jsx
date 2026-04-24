import { Link } from "react-router-dom"; // Importante para la navegación SPA
import "../../Styles/ComponentStyle/Footer/Footer.css";

// Import de imágenes
import logoContent from "../../assets/content.png";
import logoUls from "../../assets/uls_logo.png";

function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-container">
        <div className="footer-grid">
          
          {/* Logos - Linkeados al Home */}
          <div className="footer-logos">
            <Link to="/">
              <img
                src={logoContent}
                alt="Logo del proyecto Content"
                loading="lazy"
                className="logo-main"
              />
            </Link>
            <Link to="/">
              <img
                src={logoUls}
                alt="Logo Universidad de La Serena"
                loading="lazy"
                className="logo-uls"
              />
            </Link>
          </div>

          {/* Datos y Contenidos */}
          <nav className="footer-section" aria-labelledby="footer-datos">
            <h4 id="footer-datos">Datos y contenidos</h4>
            <ul role="list">
              <li><Link to="/conjuntodatos">Datos</Link></li>
              <li><Link to="/instituciones">Instituciones</Link></li>
              <li><Link to="/indicadores">Indicadores</Link></li>
              <li><Link to="/publicaciones">Publicaciones</Link></li>
              <li><Link to="/noticias">Noticias</Link></li>
            </ul>
          </nav>

          {/* Sobre nosotros - Usando la ruta dinámica /nosotros/:section */}
          <nav className="footer-section" aria-labelledby="footer-nosotros">
            <h4 id="footer-nosotros">Sobre nosotros</h4>
            <ul role="list">
              <li><Link to="/nosotros/quienes-somos">Quiénes Somos</Link></li>
              <li><Link to="/nosotros/objetivos">Objetivos</Link></li>
              <li><Link to="/nosotros/vision-mision">Visión y Misión</Link></li>
              <li><Link to="/nosotros/principios">Principios</Link></li>
              <li><Link to="/nosotros/equipo">Equipo</Link></li>
            </ul>
          </nav>

          {/* Contacto */}
          <nav className="footer-section" aria-labelledby="footer-contacto">
            <h4 id="footer-contacto">Contacto</h4>
            <ul role="list">
              <li><Link to="/formulario">Formulario de Contacto</Link></li>
              <li><Link to="/preguntas-frecuentes">Preguntas Frecuentes</Link></li>
            </ul>
          </nav>
        </div>

        <div className="footer-divider"></div>

        <div className="footer-bottom">
          <p>© 2026 Plataforma de Datos – Universidad de La Serena</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;