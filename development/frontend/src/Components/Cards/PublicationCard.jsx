// src/Components/Cards/PublicationCard.jsx
import { Link } from "react-router-dom";
import { Calendar, FileText } from "lucide-react";
import "../../Styles/ComponentStyle/Cards/PublicationCard.css";

function PublicationCard({ publication }) {
  return (
    <article className="publication-card">
      <div className="publication-image-wrapper">
        <img 
          src={publication.image} 
          alt={publication.title} 
          className="publication-image" 
          onError={(e) => { e.target.src = "/img/default-publication.jpg"; }} 
        />
      </div>

      <div className="publication-content">
        <div className="publication-header">
          <span className="publication-date">
            <Calendar size={14} /> {new Date(publication.date).toLocaleDateString()}
          </span>
        </div>

        <h3 className="publication-title">{publication.title}</h3>
        <p className="publication-description">{publication.description}</p>

        <div className="publication-meta">
          <span className="tag-type">
            <FileText size={14} /> {publication.type}
          </span>
        </div>

        <div className="publication-actions">
          <Link to={`/publicaciones/${publication.slug}`} className="btn-leer-mas">
            Leer más
          </Link>
        </div>
      </div>
    </article>
  );
}

export default PublicationCard;