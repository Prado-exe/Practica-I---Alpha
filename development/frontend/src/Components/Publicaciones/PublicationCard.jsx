import "../../Styles/ComponentStyle/Publicaciones/PublicationCard.css"

function PublicationCard({ publication }) {
  return (
    <article className="publication-card">
      <div className="publication-content">
        <h3>{publication.title}</h3>
        <p className="publication-date">{new Date(publication.date).toLocaleDateString()}</p>
        <p className="publication-author">{publication.author}</p>
        <p>{publication.description}</p>
        <div className="publication-meta">
          <span className="tag">{publication.type}</span>
          {publication.tags.map((tag, i) => (
            <span key={i} className="tag">{tag}</span>
          ))}
        </div>
        <div className="publication-footer">
          <button className="publication-btn">Ver publicación</button>
        </div>
      </div>
    </article>
  );
}

export default PublicationCard;