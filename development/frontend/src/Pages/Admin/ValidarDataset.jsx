import { useState, useEffect } from "react";
import { useAuth } from "../../Context/AuthContext";
import "../../styles/pages_styles/Admin/GestionDatasets.css";

const API_URL = import.meta.env.VITE_API_URL || "http://3.139.202.192:3000";

function ValidarDataset({ datasetId, onCancel }) {
  const { user } = useAuth();
  const [dataset, setDataset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewComment, setReviewComment] = useState("");

  useEffect(() => {
    const fetchDetalles = async () => {
      try {
        const res = await fetch(`${API_URL}/api/datasets/${datasetId}`, {
          headers: { "Authorization": `Bearer ${user.token}` }
        });
        if (res.ok) setDataset((await res.json()).data);
        else alert("Error al obtener los detalles del dataset.");
      } catch (error) {
        console.error("Error de red:", error);
      } finally {
        setLoading(false);
      }
    };
    if (datasetId) fetchDetalles();
  }, [datasetId, user.token]);

  const handleAction = async (actionType) => {
    if (reviewComment.trim().length < 5) {
      return alert("Por favor, ingresa un comentario de revisión detallado (mínimo 5 caracteres).");
    }

    const confirmMsg = actionType === 'publish' 
      ? "¿Estás seguro de APROBAR y PUBLICAR este dataset para que sea visible por todos?" 
      : "¿Estás seguro de RECHAZAR este dataset y devolverlo al usuario?";
      
    if (!window.confirm(confirmMsg)) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/datasets/${datasetId}/validate`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "Authorization": `Bearer ${user.token}` 
        },
        body: JSON.stringify({ action: actionType, review_comment: reviewComment })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al procesar la validación.");

      alert(`¡Éxito! ${data.message}`);
      onCancel(); // Volver a la tabla y recargar
    } catch (error) {
      console.error(error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: "20px", textAlign: "center" }}>Cargando detalles...</div>;
  if (!dataset) return <div style={{ padding: "20px", textAlign: "center" }}>No se encontró el dataset. <button onClick={onCancel}>Volver</button></div>;

  return (
    <div className="gestion-datasets" style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px", background: "white", color: "black", borderRadius: '8px' }}>
      
      {/* HEADER Y BOTÓN VOLVER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #eee", paddingBottom: "15px", marginBottom: "20px" }}>
        <div>
          <h1 style={{ margin: 0, color: "#333" }}>Validar Dataset: {dataset.title}</h1>
          <span style={{ display: "inline-block", marginTop: "10px", padding: "5px 10px", background: "#ff9800", color: "white", borderRadius: "15px", fontSize: "12px", fontWeight: 'bold' }}>
            Estado: {dataset.dataset_status}
          </span>
        </div>
        <button onClick={onCancel} style={{ padding: "10px 20px", background: "#f5f5f5", color: "#333", border: "1px solid #ccc", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>
          ← Volver a la Lista
        </button>
      </div>

      {/* METADATOS BÁSICOS (Vista de RevisarDataset) */}
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
                  <td style={{ padding: "10px", border: "1px solid #ccc", fontWeight: 'bold' }}>{file.display_name || "Archivo"}</td>
                  <td style={{ padding: "10px", border: "1px solid #ccc" }}>{file.mime_type}</td>
                  <td style={{ padding: "10px", border: "1px solid #ccc" }}>{(file.file_size_bytes / 1024 / 1024).toFixed(2)} MB</td>
                  <td style={{ padding: "10px", border: "1px solid #ccc" }}>
                    <a href={file.file_url} target="_blank" rel="noopener noreferrer" style={{ color: "#2196F3", textDecoration: "none", fontWeight: "bold" }}>Descargar / Ver</a>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="4" style={{ padding: "15px", textAlign: "center", border: "1px solid #ccc" }}>No hay archivos registrados.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ÁREA DE VALIDACIÓN Y COMENTARIOS */}
      <div style={{ background: "#e3f2fd", padding: "20px", borderRadius: "8px", border: "1px solid #90caf9", marginTop: "40px" }}>
        <h2 style={{ color: "#1565c0", marginTop: 0, marginBottom: "15px" }}>Resolución del Revisor</h2>
        
        <div style={{ marginBottom: "20px" }}>
          <label style={{ fontWeight: "bold", display: "block", marginBottom: "8px" }}>Comentario de Revisión (Requerido):</label>
          <textarea 
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            placeholder="Escribe aquí tu justificación para publicar o rechazar este dataset. Este comentario quedará registrado en la auditoría..."
            style={{ width: "100%", padding: "12px", borderRadius: "4px", border: "1px solid #ccc", height: "100px", resize: "vertical" }}
            required
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "15px" }}>
          <button 
            onClick={() => handleAction('reject')}
            disabled={isSubmitting}
            style={{ padding: "12px 25px", background: "#f44336", color: "white", border: "none", borderRadius: "4px", cursor: isSubmitting ? "not-allowed" : "pointer", fontWeight: "bold", fontSize: "15px" }}>
            {isSubmitting ? "Procesando..." : "❌ RECHAZAR DATASET"}
          </button>
          
          <button 
            onClick={() => handleAction('publish')}
            disabled={isSubmitting}
            style={{ padding: "12px 25px", background: "#4CAF50", color: "white", border: "none", borderRadius: "4px", cursor: isSubmitting ? "not-allowed" : "pointer", fontWeight: "bold", fontSize: "15px" }}>
            {isSubmitting ? "Procesando..." : "✅ APROBAR Y PUBLICAR"}
          </button>
        </div>
      </div>

    </div>
  );
}

export default ValidarDataset;