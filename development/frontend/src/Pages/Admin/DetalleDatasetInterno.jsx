import { useState, useEffect } from "react";
import { useAuth } from "../../Context/AuthContext";
import { FiArrowLeft, FiFile, FiTag, FiInfo } from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function DetalleDatasetInterno({ datasetId, onBack }) {
  const { user } = useAuth();
  const [dataset, setDataset] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await fetch(`${API_URL}/api/datasets/${datasetId}`, {
          headers: { "Authorization": `Bearer ${user.token}` }
        });
        if (res.ok) {
          const json = await res.json();
          setDataset(json.data);
        }
      } catch (error) {
        console.error("Error al cargar detalles:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [datasetId, user.token]);

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Cargando información...</div>;
  if (!dataset) return <div style={{ padding: '20px', textAlign: 'center' }}>No se encontró el dataset.</div>;

  return (
    <div className="gestion-datasets" style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <div className="header" style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
        <button onClick={onBack} className="btn-back" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 15px', cursor: 'pointer' }}>
          <FiArrowLeft /> Volver
        </button>
        <h1>{dataset.title}</h1>
      </div>

      <div className="detalle-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '25px' }}>
        {/* COLUMNA PRINCIPAL */}
        <div className="detalle-main">
          <section style={{ marginBottom: '25px', background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
              <FiInfo /> Información General
            </h3>
            <p><strong>Resumen:</strong> {dataset.summary}</p>
            <p><strong>Descripción:</strong></p>
            <div style={{ whiteSpace: 'pre-wrap', background: '#f9f9f9', padding: '15px', borderRadius: '5px' }}>
              {dataset.description}
            </div>
          </section>

          <section style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
            <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Archivos Adjuntos</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {dataset.files?.map(file => (
                <li key={file.aws_file_reference_id} style={{ padding: '10px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FiFile />
                  <div>
                    <div><strong>{file.display_name}</strong></div>
                    <small style={{ color: '#666' }}>{file.mime_type} • {(file.file_size_bytes / 1024 / 1024).toFixed(2)} MB</small>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* BARRA LATERAL (METADATOS TÉCNICOS) */}
        <div className="detalle-side">
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
            <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Metadatos</h3>
            <div className="meta-item" style={{ marginBottom: '15px' }}>
              <small style={{ color: '#666', display: 'block' }}>Categoría</small>
              <span>{dataset.category_name}</span>
            </div>
            <div className="meta-item" style={{ marginBottom: '15px' }}>
              <small style={{ color: '#666', display: 'block' }}>Institución</small>
              <span>{dataset.institution_name}</span>
            </div>
            <div className="meta-item" style={{ marginBottom: '15px' }}>
              <small style={{ color: '#666', display: 'block' }}>Licencia</small>
              <span>{dataset.license_name}</span>
            </div>
            {dataset.objective_name && (
              <div className="meta-item" style={{ marginBottom: '15px' }}>
                <small style={{ color: '#666', display: 'block' }}>ODS Relacionado</small>
                <span>{dataset.objective_code} - {dataset.objective_name}</span>
              </div>
            )}
            <div className="meta-item" style={{ marginBottom: '15px' }}>
              <small style={{ color: '#666', display: 'block' }}>Frecuencia</small>
              <span>{dataset.update_frequency || 'No definida'}</span>
            </div>
            <div className="meta-item" style={{ marginBottom: '15px' }}>
              <small style={{ color: '#666', display: 'block' }}>Cobertura Geográfica</small>
              <span>{dataset.geographic_coverage || 'N/A'}</span>
            </div>

            <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><FiTag /> Etiquetas</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {dataset.tags?.map(t => (
                  <span key={t.tag_id} style={{ background: '#e3f2fd', color: '#1976d2', padding: '3px 10px', borderRadius: '15px', fontSize: '12px' }}>
                    {t.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DetalleDatasetInterno;