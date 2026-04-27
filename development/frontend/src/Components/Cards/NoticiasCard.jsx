import "../../Styles/ComponentStyle/Cards/NoticiasCard.css";
import { Link } from "react-router-dom";
function NoticiasCard({ news }) {
  return (
    <article className="news-card">

      {/* IMAGEN */}
      <div className="news-image-wrapper">
        <img src={news.image} alt={news.title} className="news-image" />
      </div>

      {/* CONTENIDO */}
      <div className="news-content">

        {/* HEADER */}
        <div className="news-header">
          <span className="news-date">
            {new Date(news.date).toLocaleDateString()}
          </span>
        </div>

        {/* TITULO */}
        <h3 className="news-title">{news.title}</h3>

        {/* DESCRIPCIÓN */}
        <p className="news-description">{news.description}</p>

        {/* TAGS */}
        <div className="news-meta">
          <span className="tag primary">{news.category}</span>
          {news.tags?.map((tag, i) => (
            <span key={i} className="tag">{tag}</span>
          ))}
        </div>

        {/* FOOTER */}
        <div className="noticia-actions">
          <Link to={`/noticias/${news.slug}`} className="btn-leer-mas">
            Leer más
          </Link>
        </div>

      </div>
    </article>
  );
}

export default NoticiasCard;