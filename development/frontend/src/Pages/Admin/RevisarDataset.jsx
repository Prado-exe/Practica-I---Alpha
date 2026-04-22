import { useState, useEffect } from "react";
import { useAuth } from "../../Context/AuthContext";
import "../../styles/pages_styles/Admin/GestionDatasets.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function RevisarDataset({ datasetId, onCancel }) {
  const { user } = useAuth();
  const [dataset, setDataset] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetalles = async () => {
      try {
        const res = await fetch(`${API_URL}/api/datasets/${datasetId}`, {
          headers: { "Authorization": `Bearer ${user.token}` }
        });
        if (res.ok) {
          const json = await res.json();
          setDataset(json.data);
        } else {
          alert("Error al obtener los detalles del dataset.");
        }
      } catch (error) {
        console.error("Error de red:", error);
      } finally {
        setLoading(false);
      }
    };

    if (datasetId) fetchDetalles();
  }, [datasetId, user.token]);

  if (loading) return <div style={{ padding: "20px", textAlign: "center" }}>Cargando detalles...</div>;
  if (!dataset) return <div style={{ padding: "20px", textAlign: "center" }}>No se encontró el dataset. <button onClick={onCancel}>Volver</button></div>;

  return (
    <div className="gestion-datasets" style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px", background: "white", color: "black" }}>
      
      {/* HEADER Y BOTÓN VOLVER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #eee", paddingBottom: "15px", marginBottom: "20px" }}>
        <div>
          <h1 style={{ margin: 0, color: "#333" }}>Detalles del Dataset: {dataset.title}</h1>
          <span style={{ display: "inline-block", marginTop: "10px", padding: "5px 10px", background: "#1976d2", color: "white", borderRadius: "15px", fontSize: "12px" }}>
            Estado: {dataset.dataset_status}
          </span>
        </div>
        <button onClick={onCancel} style={{ padding: "10px 20px", background: "#f44336", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>
          ← Volver a la Lista
        </button>
      </div>

      {/* METADATOS BÁSICOS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "30px" }}>
        <div style={{ background: "#f9f9f9", padding: "15px", borderRadius: "8px" }}>
          <h3 style={{ marginTop: 0 }}>Información General</h3>
          <p><strong>Categoría:</strong> {dataset.category_name}</p>
          <p><strong>Institución:</strong> {dataset.institution_name || "N/A"}</p>
          <p><strong>Licencia:</strong> {dataset.license_name}</p>
          <p><strong>Nivel de Acceso:</strong> {dataset.access_level}</p>
          <p><strong>Fecha de Creación de Datos:</strong> {dataset.creation_date ? dataset.creation_date.split('T')[0] : "N/A"}</p>
        </div>
        <div style={{ background: "#f9f9f9", padding: "15px", borderRadius: "8px" }}>
          <h3 style={{ marginTop: 0 }}>Resumen y Descripción</h3>
          <p><strong>Resumen:</strong> {dataset.summary}</p>
          <p style={{ whiteSpace: "pre-wrap" }}><strong>Descripción:</strong><br/>{dataset.description}</p>
        </div>
      </div>

      {/* TABLA DE ARCHIVOS (AWS) */}
      <div style={{ marginBottom: "30px" }}>
        <h3 style={{ borderBottom: "1px solid #ccc", paddingBottom: "10px" }}>Archivos Subidos (AWS Storage)</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
          <thead style={{ background: "#e0e0e0", textAlign: "left" }}>
            <tr>
              <th style={{ padding: "10px", border: "1px solid #ccc" }}>ID AWS</th>
              <th style={{ padding: "10px", border: "1px solid #ccc" }}>Nombre (Display)</th>
              <th style={{ padding: "10px", border: "1px solid #ccc" }}>Tipo (MIME)</th>
              <th style={{ padding: "10px", border: "1px solid #ccc" }}>Tamaño</th>
              <th style={{ padding: "10px", border: "1px solid #ccc" }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {dataset.files && dataset.files.length > 0 ? (
              dataset.files.map((file) => (
                <tr key={file.aws_file_reference_id}>
                  <td style={{ padding: "10px", border: "1px solid #ccc" }}>{file.aws_file_reference_id}</td>
                  <td style={{ padding: "10px", border: "1px solid #ccc" }}>{file.display_name || "Archivo"}</td>
                  <td style={{ padding: "10px", border: "1px solid #ccc" }}>{file.mime_type}</td>
                  <td style={{ padding: "10px", border: "1px solid #ccc" }}>{(file.file_size_bytes / 1024 / 1024).toFixed(2)} MB</td>
                  <td style={{ padding: "10px", border: "1px solid #ccc" }}>
                    <a href={file.file_url} target="_blank" rel="noopener noreferrer" style={{ color: "#2196F3", textDecoration: "none", fontWeight: "bold" }}>Descargar / Ver</a>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="5" style={{ padding: "15px", textAlign: "center", border: "1px solid #ccc" }}>No hay archivos registrados.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* TABLA DE EVENTOS DE AUDITORÍA */}
      <div>
        <h3 style={{ borderBottom: "1px solid #ccc", paddingBottom: "10px" }}>Historial de Eventos de Auditoría</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px", fontSize: "14px" }}>
          <thead style={{ background: "#e0e0e0", textAlign: "left" }}>
            <tr>
              <th style={{ padding: "10px", border: "1px solid #ccc" }}>Fecha y Hora</th>
              <th style={{ padding: "10px", border: "1px solid #ccc" }}>Usuario (Actor)</th>
              <th style={{ padding: "10px", border: "1px solid #ccc" }}>Tipo de Evento</th>
              <th style={{ padding: "10px", border: "1px solid #ccc" }}>Resultado</th>
              <th style={{ padding: "10px", border: "1px solid #ccc" }}>Comentario</th>
            </tr>
          </thead>
          <tbody>
            {dataset.events && dataset.events.length > 0 ? (
              dataset.events.map((ev) => (
                <tr key={ev.dataset_event_id}>
                  <td style={{ padding: "10px", border: "1px solid #ccc" }}>{new Date(ev.created_at).toLocaleString()}</td>
                  <td style={{ padding: "10px", border: "1px solid #ccc" }}>{ev.actor_email || "Sistema"}</td>
                  <td style={{ padding: "10px", border: "1px solid #ccc", fontWeight: "bold" }}>{ev.event_type}</td>
                  <td style={{ padding: "10px", border: "1px solid #ccc", color: ev.event_result === 'success' ? 'green' : 'red' }}>{ev.event_result}</td>
                  <td style={{ padding: "10px", border: "1px solid #ccc" }}>{ev.event_comment || "-"}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="5" style={{ padding: "15px", textAlign: "center", border: "1px solid #ccc" }}>No hay eventos registrados.</td></tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}

export default RevisarDataset; // 👈 ESTO ES LO QUE SOLUCIONA EL ERROR