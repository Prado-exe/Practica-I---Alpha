import "../../Styles/ComponentStyle/Cards/PublicationCard.css"

function PublicationCard({ publication }) {
  return (
    <article className="publication-card">

      {/* HEADER */}
      <div className="publication-header">
        <p className="publication-date">{new Date(publication.date).toLocaleDateString()}</p>
        <p className="publication-author">{publication.author}</p>
      </div>

      {/* TÍTULO */}
      <h3 className="publication-title">{publication.title}</h3>

      {/* DESCRIPCIÓN */}
      <p className="publication-description">{publication.description}</p>

      {/* TAGS */}
      <div className="publication-meta">
        <span className="tag">{publication.type}</span>
        {publication.tags?.map((tag, i) => (
          <span key={i} className="tag">{tag}</span>
        ))}
      </div>

      {/* FOOTER BOTÓN */}
      <div className="publication-footer">
        <button className="publication-btn">Ver publicación →</button>
      </div>
    </article>
  );
}

export default PublicationCard;