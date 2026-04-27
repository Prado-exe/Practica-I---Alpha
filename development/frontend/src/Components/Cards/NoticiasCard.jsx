import { Link } from "react-router-dom";
import { Calendar, Tag } from "lucide-react";
import "../../Styles/ComponentStyle/Cards/NoticiasCard.css";

function NoticiasCard({ news }) {
  return (
    <article className="noticia-card-horizontal">
      {/* IMAGEN A LA IZQUIERDA */}
      <div className="noticia-image-wrapper-horizontal">
        <img 
          src={news.image} 
          alt={news.title} 
          className="noticia-image-horizontal" 
          onError={(e) => { e.target.src = "/img/default-news.jpg"; }} 
        />
      </div>

      {/* CONTENIDO A LA DERECHA */}
      <div className="noticia-content-horizontal">
        
        {/* HEADER: Categoría principal y Fecha */}
        <div className="noticia-header-horizontal">
          <span className="tag-category-horizontal">
            <Tag size={14} /> {news.category || "Noticia"}
          </span>
          <span className="noticia-date-horizontal">
            <Calendar size={14} /> {new Date(news.date).toLocaleDateString('es-CL')}
          </span>
        </div>

        {/* CUERPO: Título, Descripción y Tags extras */}
        <div className="noticia-body-horizontal">
          <h3 className="noticia-title-horizontal">{news.title}</h3>
          <p className="noticia-description-horizontal">{news.description}</p>
          
          {/* Renderizado condicional de tags adicionales (si existen) */}
          {news.tags && news.tags.length > 0 && (
            <div className="noticia-tags-extra">
              {news.tags.map((tag, i) => (
                <span key={i} className="tag-secondary">#{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* ACCIONES: Botón al fondo a la derecha */}
        <div className="noticia-actions-horizontal">
          <Link to={`/noticias/${news.slug}`} className="btn-leer-mas-horizontal">
            Leer más
          </Link>
        </div>
      </div>
    </article>
  );
}

export default NoticiasCard;