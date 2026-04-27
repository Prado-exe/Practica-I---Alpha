import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Building2, Clock, BarChart2, Download, FileText, Info, Calendar, Layers, Globe } from "lucide-react";
import Breadcrumb from "../../Components/Common/Breadcrumb";
import { getPublicDatasetById } from "../../Services/DatasetService";

import "../../Styles/Pages_styles/Public/DatasetDetalle.css";

function DatasetDetalle() {
  const { id } = useParams();
  const [dataset, setDataset] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetalle = async () => {
      try {
        const data = await getPublicDatasetById(id);
        if (data) setDataset(data);
      } catch (error) {
        console.error("Error al cargar el dataset:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDetalle();
  }, [id]);

  if (loading) {
    return (
      <div className="detalle-loading-state">
        <div className="spinner"></div>
        <p>Cargando detalles del conjunto de datos...</p>
      </div>
    );
  }

  if (!dataset) {
    return (
      <div className="detalle-empty-state">
        <FileText size={48} className="empty-icon" />
        <h2>No se encontró el conjunto de datos</h2>
        <p>Es posible que haya sido eliminado o no tengas acceso.</p>
        <Link to="/datos" className="btn-volver">Volver al catálogo</Link>
      </div>
    );
  }

  return (
    <div className="dataset-detalle-page fade-in">
      <Breadcrumb paths={["Inicio", "Conjunto de datos", dataset.title || dataset.nombre]} />

      <div className="detalle-layout">
        
        {/* 🔹 COLUMNA IZQUIERDA (Institución e Historial) */}
        <aside className="detalle-sidebar">
          {/* Tarjeta de la Institución */}
          <div className="detalle-card institution-card">
            <div className="institution-logo-box">
              <Building2 size={36} strokeWidth={1.5} />
            </div>
            <h3>{dataset.institution_name || dataset.institucion || "Institución Pública"}</h3>
            <p>Agencia responsable de la publicación y mantenimiento de este conjunto de datos.</p>
          </div>

          {/* Tarjeta de Historial */}
          <div className="detalle-card history-card">
            <div className="card-header">
              <Clock size={18} />
              <h4>Historial de Actividad</h4>
            </div>
            <ul className="history-timeline">
              {dataset.events && dataset.events.length > 0 ? (
                dataset.events.map((ev) => (
                  <li key={ev.dataset_event_id}>
                    <span className="bullet"></span>
                    <p>
                      <strong>Dataset {ev.event_type === 'created' ? 'publicado' : 'actualizado'}</strong>
                      <br />
                      <span className="timeline-date">{new Date(ev.created_at).toLocaleDateString()}</span>
                    </p>
                  </li>
                ))
              ) : (
                <li>
                  <span className="bullet"></span>
                  <p>
                    <strong>Registro inicial</strong>
                    <br />
                    <span className="timeline-date">
                      {dataset.creation_date ? dataset.creation_date.split('T')[0] : "N/A"}
                    </span>
                  </p>
                </li>
              )}
            </ul>
          </div>
        </aside>

        {/* 🔹 COLUMNA DERECHA (Contenido Principal) */}
        <main className="detalle-content">
          <div className="detalle-header">
            <h1>{dataset.title || dataset.nombre}</h1>
            <Link to={`/conjuntodatos/${id}/graficos`} className="btn-graficar">
              <BarChart2 size={18} />
              Ver datos graficados
            </Link>
          </div>

          <div className="detalle-card description-card">
            <p>{dataset.description || dataset.summary || "No hay descripción disponible para este conjunto de datos."}</p>
          </div>

          {/* Tabla de Distribuciones (Archivos) */}
          <section className="detalle-section">
            <div className="section-title">
              <FileText size={20} />
              <h2>Distribuciones ({dataset.files?.length || 0})</h2>
            </div>
            
            <div className="detalle-card table-card">
              <div className="table-responsive">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Archivo</th>
                      <th>Actualizado</th>
                      <th>Formato</th>
                      <th className="text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataset.files && dataset.files.length > 0 ? (
                      dataset.files.map((file) => {
                        const formato = file.display_name.split('.').pop().toUpperCase();
                        return (
                          <tr key={file.aws_file_reference_id}>
                            <td className="font-medium text-dark">{file.display_name}</td>
                            <td className="text-muted">{new Date().toLocaleDateString()}</td>
                            <td><span className={`format-chip format-${formato.toLowerCase()}`}>{formato}</span></td>
                            <td className="text-right">
                              <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="btn-descargar">
                                <Download size={16} />
                                Descargar
                              </a>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="4" className="table-empty">No hay recursos disponibles.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Sección de Información Adicional Rediseñada */}
            <section className="detalle-section">
              <div className="section-title">
                <Info size={20} />
                <h2>Detalles del recurso</h2>
              </div>
              
              <div className="metadata-grid">
                <div className="metadata-item">
                  <div className="metadata-icon-box">
                    <Calendar size={20} />
                  </div>
                  <div className="metadata-info">
                    <span className="metadata-label">Fecha de registro</span>
                    <span className="metadata-value">
                      {dataset.creation_date ? dataset.creation_date.split('T')[0] : "N/A"}
                    </span>
                  </div>
                </div>

                <div className="metadata-item">
                  <div className="metadata-icon-box">
                    <Layers size={20} />
                  </div>
                  <div className="metadata-info">
                    <span className="metadata-label">Categoría</span>
                    <span className="metadata-value">
                      <span className="category-badge-simple">
                        {dataset.category_name || dataset.categoria || "N/A"}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="metadata-item">
                  <div className="metadata-icon-box">
                    <FileText size={20} />
                  </div>
                  <div className="metadata-info">
                    <span className="metadata-label">Licencia</span>
                    <span className="metadata-value">{dataset.license_name || "Licencia Estándar"}</span>
                  </div>
                </div>

                <div className="metadata-item">
                  <div className="metadata-icon-box">
                    <Globe size={20} />
                  </div>
                  <div className="metadata-info">
                    <span className="metadata-label">Nivel de Acceso</span>
                    <span className="metadata-value">{dataset.access_level || "Público"}</span>
                  </div>
                </div>
              </div>
            </section>
        </main>
      </div>
    </div>
  );
}

export default DatasetDetalle;