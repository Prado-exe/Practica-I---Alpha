import { useNavigate } from "react-router-dom";
import { Calendar, Building2, Tag, ArrowRight } from "lucide-react";
import "../../Styles/ComponentStyle/Cards/DatasetCard.css";

function DatasetCard({ dataset }) {
  const navigate = useNavigate();

  // 🔥 NORMALIZACIÓN LOCAL (CLAVE)
  const normalized = {
    id: dataset.id || dataset.dataset_id,

    nombre: dataset.nombre || dataset.title || "Sin título",

    descripcion:
      dataset.descripcion ||
      dataset.description ||
      dataset.summary ||
      "Sin descripción disponible.",

    institucion:
      dataset.institucion ||
      dataset.institution_name ||
      "Institución no disponible",

    categoria:
      dataset.categoria ||
      dataset.category_name ||
      null,

    fecha:
      dataset.fecha ||
      dataset.creation_date?.split("T")[0] ||
      "Sin fecha"
  };

  const handleVerDetalle = () => {
    if (normalized.id) {
      navigate(`/conjuntodatos/${normalized.id}`);
    }
  };

  return (
    <article className="dataset-card" onClick={handleVerDetalle}>
      
      <div className="dataset-card-content">

        {/* Meta */}
        <div className="dataset-meta">
          {normalized.categoria && (
            <span className="dataset-badge">
              <Tag size={12} />
              {normalized.categoria}
            </span>
          )}

          <span className="dataset-date">
            <Calendar size={14} />
            {normalized.fecha}
          </span>
        </div>

        {/* Título */}
        <h3 className="dataset-title">
          {normalized.nombre}
        </h3>

        {/* Institución */}
        <p className="dataset-institution">
          <Building2 size={16} />
          {normalized.institucion}
        </p>

        {/* Descripción */}
        <p className="dataset-description">
          {normalized.descripcion}
        </p>

      </div>

      {/* Footer */}
      <div className="dataset-card-footer">
        <span className="footer-text">Ver detalle del dataset</span>
        <div className="icon-wrapper">
          <ArrowRight size={18} className="arrow-icon" />
        </div>
      </div>

    </article>
  );
}

export default DatasetCard;