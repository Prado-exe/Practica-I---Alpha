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
        >
          Ver institución
        </button>
      </div>
    </article>
  );
}

export default InstitucionCard;