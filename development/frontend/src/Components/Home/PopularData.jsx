import { useNavigate } from "react-router-dom";
import { useFetchList } from "../../Components/Hooks/useFetchList";
import { getDatasets } from "../../Services/DatasetService";
import { Database, LayoutGrid, ArrowRight, Loader2, Info } from "lucide-react";
import "../../Styles/ComponentStyle/Home/PopularData.css";

function PopularData() {
  const navigate = useNavigate();
  // Forzamos el límite a 6 para las 2 filas de 3
  const { data: datasets, loading } = useFetchList(getDatasets, { limit: 6 });

  return (
    <section className="popdata-wrapper">
      <div className="popdata-inner">
        
        {/* HEADER CON LÍNEA DE ACENTO */}
        <div className="popdata-header">
          <div className="popdata-title-box">
            <span className="popdata-subtitle">Datos Abiertos</span>
            <h2>Información Estratégica</h2>
            <div className="popdata-accent-line"></div>
          </div>
          <button className="popdata-btn-all" onClick={() => navigate('/datasets')}>
            Explorar Catálogo <ArrowRight size={18} />
          </button>
        </div>

        {loading ? (
          <div className="popdata-loading">
            <Loader2 className="animate-spin" size={40} />
            <p>Sincronizando biblioteca de datos...</p>
          </div>
        ) : (
          <div className="popdata-grid">
            {datasets?.map((item) => (
              <article key={item.id || item.dataset_id} className="popdata-card">
                {/* Barra de color superior sutil para variación */}
                <div className="card-color-strip"></div>
                
                <div className="card-top">
                  <div className="card-logo">
                    <img
                      src={item.institucion_logo || item.institution?.image_url || "/img/default-inst.png"}
                      alt="Logo"
                      onError={(e) => { e.target.src = "/img/default-inst.png"; }}
                    />
                  </div>
                  <span className="card-badge">{item.categoria || "General"}</span>
                </div>

                <div className="card-body">
                  <h3 title={item.nombre}>{item.nombre || "Sin título"}</h3>
                  <p>{item.description || "Explora los detalles técnicos y estadísticos de este conjunto de datos."}</p>
                </div>

                <div className="card-footer">
                  <button onClick={() => navigate(`/conjuntodatos/${item.id || item.dataset_id}`)}>
                    <Info size={16} />
                    Ficha Técnica
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