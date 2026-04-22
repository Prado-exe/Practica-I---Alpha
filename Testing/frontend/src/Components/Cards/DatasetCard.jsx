// frontend/src/Components/Cards/DatasetCard.jsx
import { useNavigate } from "react-router-dom"; 
import "../../Styles/ComponentStyle/Cards/DatasetCard.css";

function DatasetCard({ dataset }) {
  const navigate = useNavigate(); // 👈 2. Inicializar

  // 3. Crear función de redirección (Asegúrate de usar el ID correcto)
  const handleVerDetalle = () => {
    const id = dataset.id || dataset.dataset_id;
    navigate(`/conjuntodatos/${id}`);
  };

  return (
    <article className="dataset-card">
      <div className="dataset-header">
        <span className="dataset-date">
          {dataset.fecha || "Sin fecha"}
        </span>

        {/* 4. Agregar el evento onClick al botón */}
        <button className="dataset-btn" onClick={handleVerDetalle}>
          Ver →
        </button>
      </div>

      {/* Institución responsable */}
      {dataset.institucion && (
        <p className="dataset-institution">
          {dataset.institucion}
        </p>
      )}

      {/* Título principal del Dataset */}
      <h3 className="dataset-title">
        {dataset.nombre}
      </h3>

      {/* Breve descripción (opcional) */}
      {dataset.description && (
        <p className="dataset-description">
          {dataset.description}
        </p>
      )}

      {/* Etiquetas / Categoría */}
      {dataset.categoria && (
        <div className="dataset-tags">
          <span className="dataset-tag">
            {dataset.categoria}
          </span>
        </div>
      )}
    </article>
  );
}

export default DatasetCard;