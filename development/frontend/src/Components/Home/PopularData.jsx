import { useNavigate } from "react-router-dom";
import "../../Styles/ComponentStyle/Home/PopularData.css";
import { useFetchList } from "../../Components/Hooks/useFetchList";
import { getDatasets } from "../../Services/DatasetService";

function PopularData() {
  const navigate = useNavigate();
  const { data: datasets, loading } = useFetchList(getDatasets, { limit: 3 });

  const handleVerDetalle = (id) => {
    navigate(`/conjuntodatos/${id}`);
  };

  return (
    <section className="expositor-wrapper">
      <div className="expositor-popdata">

        {/* HEADER */}
        <div className="expositor-header">
          <h2>datasets recientes</h2>
          <hr className="expositor-separator" />
          <p>Explora los datasets más recientes del observatorio</p>
        </div>

        {/* LOADING */}
        {loading ? (
          <div className="expositor-loading">
            <span className="loader-spinner"></span>
            <p>Cargando datasets...</p>
          </div>
        ) : (
          <div className="expositor-grid">
            {datasets?.map((item) => (
              <article
                key={item.id || item.dataset_id}
                className="expositor-card"
              >
                {/* TOP */}
                <div className="card-top-section">
                  <div className="institution-logo-box">
                    <img
                      src={
                        item.institucion_logo ||
                        item.institution?.image_url ||
                        "https://via.placeholder.com/60"
                      }
                      alt={item.institucion || "Logo"}
                      className="inst-logo"
                    />
                  </div>

                  <span className="card-category">
                    {item.categoria || "General"}
                  </span>
                </div>

                {/* CONTENT */}
                <div className="card-content">
                  <h3 title={item.nombre}>
                    {item.nombre || "Sin título"}
                  </h3>

                  <p>
                    {item.description ||
                      "No hay descripción disponible para este dataset."}
                  </p>
                </div>

                {/* FOOTER */}
                <div className="card-footer">
                  <button
                    onClick={() =>
                      handleVerDetalle(item.id || item.dataset_id)
                    }
                    className="card-button"
                  >
                    Ver dataset
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default PopularData;