import "../styles/componentes_styles/footer.css";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">

        {/* Columna 1 – Imágenes */}
        <div className="footer-images">
          <img src="/src/assets/content.png" alt="logo" />
          <img src="/src/assets/uls_logo.png" alt="Logo" />
        </div>

        {/* Columna 2 */}
        <div className="footer-section">
          <h4> Datos y contenidos</h4>
          <button> Datos </button>
          <button> Instituciones </button>
          <button> Indicadores</button>
          <button> publicaciones </button>
          <button> noticias</button>
        </div>

        {/* Columna 3 */}
        <div className="footer-section">
          <h4> Sobre nosotros</h4>
          <button> Objetivo estrategico</button>
          <button> vision y mision</button>
          <button> principios</button>
          <button> metodologia</button>
        </div>

        {/* Columna 4 */}
        <div className="footer-section">
          <h4> contacto</h4>
          <button>formulario de contacto</button>

        </div>

      </div>

      <p className="footer-copy">© 2026 Página</p>
    </footer>
  );
}

export default Footer;
