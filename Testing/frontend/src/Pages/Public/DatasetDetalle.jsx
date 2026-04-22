import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Breadcrumb from "../../Components/Common/Breadcrumb";
import { getPublicDatasetById } from "../../Services/DatasetService";

// Sugerencia: Crea este CSS basándote en la estructura de clases
import "../../Styles/Pages_styles/Public/DatasetDetalle.css";

function DatasetDetalle() {
  const { id } = useParams(); // Captura el ID de la URL
  const [dataset, setDataset] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetalle = async () => {
      try {
        // Llamaremos a una nueva función pública que crearemos en el servicio
        const data = await getPublicDatasetById(id);
        if (data) {
          setDataset(data);
        }
      } catch (error) {
        console.error("Error al cargar el dataset:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDetalle();
  }, [id]);

  if (loading) return <div className="loading-state">Cargando detalles del dataset...</div>;
  if (!dataset) return <div className="empty-state">No se encontró el dataset. <Link to="/datos">Volver</Link></div>;

  return (
    <div className="dataset-detalle-page">
      <Breadcrumb paths={["Inicio", "Conjunto de datos", dataset.title || dataset.nombre]} />

      <div className="detalle-layout">
        
        {/* 🔹 COLUMNA IZQUIERDA (Institución e Historial) */}
        <aside className="detalle-sidebar">
          {/* Tarjeta de la Institución */}
          <div className="institution-card">
            {/* Aquí puedes poner un logo genérico o el de la institución */}
            <div className="institution-logo-placeholder">🏛️</div>
            <h3>{dataset.institution_name || dataset.institucion || "Institución Pública"}</h3>
            <p>Agencia responsable de la publicación y mantenimiento de este conjunto de datos.</p>
          </div>

          {/* Tarjeta de Historial (Opcional, basado en tus eventos) */}
          <div className="history-card">
            <h4>Historial de Actividad</h4>
            <ul className="history-timeline">
              {dataset.events && dataset.events.length > 0 ? (
                dataset.events.map((ev) => (
                  <li key={ev.dataset_event_id}>
                    <span className="bullet"></span>
                    <p>
                      Dataset {ev.event_type === 'created' ? 'publicado' : 'actualizado'} el {new Date(ev.created_at).toLocaleDateString()}
                    </p>
                  </li>
                ))
              ) : (
                <li><p>Registro inicial el {dataset.creation_date ? dataset.creation_date.split('T')[0] : "N/A"}</p></li>
              )}
            </ul>
          </div>
        </aside>

        {/* 🔹 COLUMNA DERECHA (Contenido Principal) */}
        <main className="detalle-content">
          <h1>{dataset.title || dataset.nombre}</h1>
          
          <div className="detalle-description">
            <p>{dataset.description || dataset.summary || "No hay descripción disponible para este conjunto de datos."}</p>
          </div>

          {/* Tabla de Distribuciones (Archivos) */}
          <section className="detalle-section">
            <h2>Distribuciones ({dataset.files?.length || 0})</h2>
            <div className="table-responsive">
              <table className="distribuciones-table">
                <thead>
                  <tr>
                    <th>Título ↕</th>
                    <th>Actualizado ↕</th>
                    <th>Formatos ↕</th>
                    <th>Acción ↕</th>
                  </tr>
                </thead>
                <tbody>
                  {dataset.files && dataset.files.length > 0 ? (
                    dataset.files.map((file) => {
                      // Extraer extensión para el "chip" de formato (ej: csv, json)
                      const formato = file.display_name.split('.').pop().toUpperCase();
                      return (
                        <tr key={file.aws_file_reference_id}>
                          <td>{file.display_name}</td>
                          <td>{new Date().toLocaleDateString() /* Reemplazar con fecha real si el backend la envía */}</td>
                          <td><span className={`format-chip format-${formato.toLowerCase()}`}>{formato}</span></td>
                          <td className="actions-cell">
                            <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="btn-descargar">
                              Descargar
                            </a>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center">No hay recursos disponibles.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Tabla de Información Adicional */}
          <section className="detalle-section">
            <h2>Información adicional</h2>
            <table className="info-adicional-table">
              <thead>
                <tr>
                  <th>Campo</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Fecha de registro</td>
                  <td>{dataset.creation_date ? dataset.creation_date.split('T')[0] : "N/A"}</td>
                </tr>
                <tr>
                  <td>Categoría</td>
                  <td>{dataset.category_name || dataset.categoria || "N/A"}</td>
                </tr>
                <tr>
                  <td>Licencia</td>
                  <td>{dataset.license_name || "N/A"}</td>
                </tr>
                <tr>
                  <td>Nivel de Acceso</td>
                  <td>{dataset.access_level || "Público"}</td>
                </tr>
              </tbody>
            </table>
          </section>

        </main>
      </div>
    </div>
  );
}

export default DatasetDetalle;