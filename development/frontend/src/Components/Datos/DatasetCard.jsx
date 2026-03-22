import "../../Styles/ComponentStyle/Datos/DatasetCard.css"

function DatasetCard({ dataset }) {
  return (
    <article className="dataset-card">

      {/* Header */}
      <div className="dataset-header">
        <span className="dataset-date">
          {dataset.created || "Sin fecha"}
        </span>

        <button className="dataset-btn">
          Ver →
        </button>
      </div>

      {/* Institución */}
      {dataset.institution && (
        <p className="dataset-institution">
          {dataset.institution}
        </p>
      )}

      {/* Título */}
      <h3 className="dataset-title">
        {dataset.title}
      </h3>

      {/* Descripción */}
      <p className="dataset-description">
        {dataset.description}
      </p>

      {/* Tags */}
      {dataset.tags?.length > 0 && (
        <div className="dataset-tags">
          {dataset.tags.map(tag => (
            <span key={tag} className="dataset-tag">
              {tag}
            </span>
          ))}
        </div>
      )}

    </article>
  );
}

export default DatasetCard;