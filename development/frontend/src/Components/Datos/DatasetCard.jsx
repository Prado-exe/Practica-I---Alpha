import "../../Styles/Component_styles/DatasetCard.css";

function DatasetCard({ dataset }) {
  return (
    <div className="dataset-card">
      <h3>{dataset.title}</h3>
      <p>{dataset.description}</p>
      {dataset.tags && dataset.tags.length > 0 && (
        <div className="dataset-tags">
          {dataset.tags.map((tag, idx) => (
            <span key={idx} className="dataset-tag">
              {tag}
            </span>
          ))}
        </div>
      )}
      {dataset.updated && <p className="dataset-updated">Actualizado: {dataset.updated}</p>}
    </div>
  );
}

export default DatasetCard;