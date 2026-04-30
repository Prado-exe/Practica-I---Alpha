import { Link } from "react-router-dom";
import "../../Styles/Pages_styles/Public/Error404.css";

function Error404() {
  return (
    <div className="error404-container">
      <h1>404</h1>
      <h2>Página no encontrada</h2>
      <p>La página que buscas no existe o fue movida.</p>

      <Link to="/" className="error404-btn">
        Volver al inicio
      </Link>
    </div>
  );
}

export default Error404;