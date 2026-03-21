import React from "react";
import "../../Styles/ComponentStyle/Noticias/NoticiasCard.css";
function NoticiasCard({ news }) {
  return (
    <article className="news-card">
      <img src={news.image} alt={news.title} className="news-image" />
      <div className="news-content">
        <h3>{news.title}</h3>
        <p className="news-date">{new Date(news.date).toLocaleDateString()}</p>
        <p>{news.description}</p>
        <div className="news-meta">
          <span className="tag">{news.category}</span>
          {news.tags.map((tag, i) => (
            <span key={i} className="tag">{tag}</span>
          ))}
        </div>
        <div className="news-footer">
          <button className="news-btn">Leer más</button>
        </div>
      </div>
    </article>
  );
}

export default NoticiasCard;