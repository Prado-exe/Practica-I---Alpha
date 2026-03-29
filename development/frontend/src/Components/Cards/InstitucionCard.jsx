<<<<<<< HEAD
import { useNavigate } from "react-router-dom";
import "../../Styles/ComponentStyle/Cards/InstitucionCard.css";

function InstitucionCard({ institucion }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/instituciones/${institucion.id}`);
  };

  return (
    <article
      className="institucion-card"
      aria-labelledby={`inst-${institucion.id}`}
    >
      <div className="card-header">
        <img
          src={institucion.logo}
          alt={`Logo de ${institucion.nombre}`}
          loading="lazy"
        />

        <h3 id={`inst-${institucion.id}`}>
          {institucion.nombre}
        </h3>
      </div>

      <p className="descripcion">
        {institucion.descripcion}
      </p>

      <div className="card-footer">
        <span className="dataset-count">
          {institucion.datasets} datasets
        </span>

        <button 
          className="ver-btn"
          onClick={handleClick}
=======
function InstitucionCard({ institucion, onOpenModal }) {
  // 🛡️ PROTECCIÓN: Si no hay descripción, usamos un texto por defecto en vez de explotar
  const descripcionSegura = institucion.description || "Sin descripción disponible.";

  return (
    <div className="institucion-card">
      
      <div className="card-header">
        <img 
          src={institucion.logo_url} 
          alt={`Logo de ${institucion.short_name || institucion.legal_name}`} 
        />
        <h3>{institucion.legal_name}</h3>
      </div>
      
      <p className="descripcion">
        {descripcionSegura.length > 120 
          ? descripcionSegura.substring(0, 120) + "..." 
          : descripcionSegura}
      </p>
      
      <div className="card-footer">
        <span className="dataset-count">
          <strong>0</strong> datasets
        </span>
        <button 
          className="ver-btn" 
          onClick={() => onOpenModal(institucion)}
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
        >
          Ver institución
        </button>
      </div>
<<<<<<< HEAD
    </article>
=======
      
    </div>
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
  );
}

export default InstitucionCard;