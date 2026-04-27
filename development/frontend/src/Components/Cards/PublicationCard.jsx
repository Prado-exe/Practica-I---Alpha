import { Link } from "react-router-dom";
import { Calendar, FileText } from "lucide-react";
import "../../Styles/ComponentStyle/Cards/PublicationCard.css";

function PublicationCard({ publication }) {
  return (
    <article className="publication-card-horizontal">
      <div className="publication-image-wrapper-horizontal">
        <img 
          src={publication.image} 
          alt={publication.title} 
          className="publication-image-horizontal" 
          onError={(e) => { e.target.src = "/img/default-publication.jpg"; }} 
        />
      </div>

      <div className="publication-content-horizontal">
        <div className="publication-header-horizontal">
          <span className="tag-type-horizontal">
            <FileText size={14} /> {publication.type || "Documento"}
          </span>
          <span className="publication-date-horizontal">
            <Calendar size={14} /> {new Date(publication.date).toLocaleDateString('es-CL')}
          </span>
        </div>

        <div className="publication-body-horizontal">
          <h3 className="publication-title-horizontal">{publication.title}</h3>
          <p className="publication-description-horizontal">{publication.description}</p>
        </div>

        <div className="publication-actions-horizontal">
          <Link to={`/publicaciones/${publication.slug}`} className="btn-leer-mas-horizontal">
            Leer más
          </Link>
        </div>
      </div>
    </article>
  );
}

export default PublicationCard;