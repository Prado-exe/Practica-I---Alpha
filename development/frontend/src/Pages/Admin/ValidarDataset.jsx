import { useState, useEffect } from "react";
import { useAuth } from "../../Context/AuthContext";
import { FiCheck, FiX, FiInfo, FiFileText } from "react-icons/fi";
import "../../Styles/Pages_styles/Admin/GestionDatasets.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

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

    const isPublish = actionType === 'publish';
    const confirmMsg = isPublish 
      ? "¿Estás seguro de APROBAR esta solicitud para que los cambios/creación sean públicos?" 
      : "¿Estás seguro de RECHAZAR esta solicitud y devolverla al usuario?";
      
    if (!window.confirm(confirmMsg)) return;

    setIsSubmitting(true);
    try {
      // Usamos PUT como definimos en la arquitectura de validación
      const res = await fetch(`${API_URL}/api/datasets/${datasetId}/validate`, {
        method: "PUT",
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

  if (loading) return <div style={{ padding: "20px", textAlign: "center" }}>Cargando detalles y comparaciones...</div>;
  if (!dataset || !dataset.pending_request) return <div style={{ padding: "20px", textAlign: "center" }}>No se encontraron solicitudes pendientes para este dataset. <button onClick={onCancel}>Volver</button></div>;

  const req = dataset.pending_request;
  const isEdit = req.request_type === 'edit';
  const isArchive = req.request_type === 'archive';
  const isCreate = req.request_type === 'create';

  return (
    <div className="gestion-datasets" style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px", background: "white", color: "black", borderRadius: '8px' }}>
      
      {/* HEADER Y BOTÓN VOLVER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #eee", paddingBottom: "15px", marginBottom: "20px" }}>
        <div>
          <h1 style={{ margin: 0, color: "#333" }}>Validar Solicitud: {dataset.title}</h1>
          <p style={{ margin: '5px 0 0 0', color: '#666' }}>
            Solicitado por: <strong>{req.requester_name || "Usuario"}</strong> 
            {" | "} Tipo: <strong style={{ textTransform: 'uppercase', color: isArchive ? '#dc3545' : (isEdit ? '#ff9800' : '#4CAF50') }}>{req.request_type}</strong>
          </p>
        </div>
        <button onClick={onCancel} style={{ padding: "10px 20px", background: "#f5f5f5", color: "#333", border: "1px solid #ccc", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>
          ← Volver a la Lista
        </button>
      </div>

      {/* MENSAJE DEL SOLICITANTE */}
      {req.message && (
        <div style={{ padding: '15px', backgroundColor: '#e3f2fd', borderLeft: '4px solid #1976d2', marginBottom: '20px', borderRadius: '4px' }}>
          <h4 style={{ margin: '0 0 5px 0', color: '#0d47a1' }}>Mensaje del Data Admin:</h4>
          <p style={{ margin: 0, fontStyle: 'italic' }}>"{req.message}"</p>
        </div>
      )}

      {/* VISTA PARA CREACIÓN (Muestra los datos normales) */}
      {isCreate && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "30px" }}>
          <div style={{ background: "#f9f9f9", padding: "15px", borderRadius: "8px" }}>
            <h3 style={{ marginTop: 0, color: '#4CAF50' }}>Datos del Nuevo Dataset</h3>
            <p><strong>Categoría:</strong> {dataset.category_name}</p>
            <p><strong>Institución:</strong> {dataset.institution_name || "N/A"}</p>
            <p><strong>Licencia:</strong> {dataset.license_name}</p>
            <p><strong>Nivel de Acceso:</strong> {dataset.access_level}</p>
            <p><strong>Etiquetas:</strong> {dataset.tags?.map(t => t.name).join(', ') || "Ninguna"}</p>
          </div>
          <div style={{ background: "#f9f9f9", padding: "15px", borderRadius: "8px" }}>
            <h3 style={{ marginTop: 0 }}>Textos</h3>
            <p><strong>Resumen:</strong> {dataset.summary}</p>
            <p style={{ whiteSpace: "pre-wrap" }}><strong>Descripción:</strong><br/>{dataset.description}</p>
          </div>
        </div>
      )}

      {/* VISTA PARA ARCHIVADO (Aviso de baja) */}
      {isArchive && (
        <div style={{ textAlign: 'center', padding: '40px 20px', background: '#ffebee', borderRadius: '8px', border: '1px solid #ffcdd2', marginBottom: '30px' }}>
          <FiInfo size={50} color="#dc3545" style={{ marginBottom: '15px' }} />
          <h2 style={{ color: '#d32f2f', margin: '0 0 10px 0' }}>Petición de Baja de Catálogo</h2>
          <p style={{ fontSize: '16px', color: '#555' }}>
            El usuario ha solicitado marcar este dataset como <strong>ARCHIVADO</strong>.<br/>
            Si apruebas esta solicitud, dejará de ser visible para el público inmediatamente.
          </p>
        </div>
      )}

      {/* VISTA PARA EDICIÓN (Comparación lado a lado) */}
      {isEdit && req.resolved_changes && (
        <div style={{ marginBottom: "30px" }}>
          <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Comparación de Cambios</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '15px' }}>
            
            {/* COLUMNA ACTUAL */}
            <div style={{ padding: '15px', border: '1px solid #ccc', borderRadius: '6px', backgroundColor: '#fafafa' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#555', textAlign: 'center' }}>Versión Actual Pública</h4>
              <p><strong>Título:</strong> {dataset.title}</p>
              <p><strong>Categoría:</strong> {dataset.category_name}</p>
              <p><strong>Etiquetas:</strong> {dataset.tags?.map(t => t.name).join(', ') || "Ninguna"}</p>
              <p><strong>Resumen:</strong> {dataset.summary}</p>
              <p style={{ whiteSpace: "pre-wrap", fontSize: '14px', background: '#eee', padding: '10px', borderRadius: '4px' }}><strong>Descripción:</strong><br/>{dataset.description}</p>
            </div>

            {/* COLUMNA PROPUESTA */}
            <div style={{ padding: '15px', border: '1px solid #4CAF50', borderRadius: '6px', backgroundColor: '#f1f8e9' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#2e7d32', textAlign: 'center' }}>Modificaciones Propuestas</h4>
              <p><strong>Título:</strong> <span style={{ color: dataset.title !== req.resolved_changes.title ? '#d32f2f' : 'inherit' }}>{req.resolved_changes.title}</span></p>
              <p><strong>Categoría:</strong> <span style={{ color: dataset.category_name !== req.resolved_changes.category_name ? '#d32f2f' : 'inherit' }}>{req.resolved_changes.category_name}</span></p>
              <p><strong>Etiquetas:</strong> {req.resolved_changes.tag_names?.join(', ') || "Ninguna"}</p>
              <p><strong>Resumen:</strong> {req.resolved_changes.summary}</p>
              <p style={{ whiteSpace: "pre-wrap", fontSize: '14px', background: '#fff', padding: '10px', border: '1px solid #c8e6c9', borderRadius: '4px' }}><strong>Descripción:</strong><br/>{req.resolved_changes.description}</p>
            </div>

          </div>
        </div>
      )}

      {/* TABLA DE ARCHIVOS (Aplica para Create y Edit) */}
      {!isArchive && (
        <div style={{ marginBottom: "30px" }}>
          <h3 style={{ borderBottom: "1px solid #ccc", paddingBottom: "10px" }}>Auditoría de Archivos Físicos</h3>
          
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
            <thead style={{ background: "#e0e0e0", textAlign: "left" }}>
              <tr>
                <th style={{ padding: "10px", border: "1px solid #ccc" }}>Estado / Rol</th>
                <th style={{ padding: "10px", border: "1px solid #ccc" }}>Nombre del Archivo</th>
                <th style={{ padding: "10px", border: "1px solid #ccc" }}>Tamaño</th>
                <th style={{ padding: "10px", border: "1px solid #ccc" }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              
              {/* Archivos Originales (Si es edición, tachamos los que el usuario quiere borrar) */}
              {dataset.files && dataset.files.map((file) => {
                const isMarkedForDeletion = isEdit && req.resolved_changes?.deleted_file_ids?.includes(file.aws_file_reference_id);
                return (
                  <tr key={`old-${file.aws_file_reference_id}`} style={{ background: isMarkedForDeletion ? '#ffebee' : '#fff' }}>
                    <td style={{ padding: "10px", border: "1px solid #ccc", color: isMarkedForDeletion ? '#dc3545' : '#666', fontWeight: 'bold' }}>
                      {isMarkedForDeletion ? '🗑️ A ELIMINAR' : '✔️ ORIGINAL'}
                    </td>
                    <td style={{ padding: "10px", border: "1px solid #ccc", textDecoration: isMarkedForDeletion ? 'line-through' : 'none' }}>
                      <FiFileText style={{ marginRight: '5px', verticalAlign: 'middle' }} />
                      {file.display_name}
                    </td>
                    <td style={{ padding: "10px", border: "1px solid #ccc" }}>{(file.file_size_bytes / 1024 / 1024).toFixed(2)} MB</td>
                    <td style={{ padding: "10px", border: "1px solid #ccc" }}>
                      <a href={file.file_url} target="_blank" rel="noopener noreferrer" style={{ color: "#2196F3", textDecoration: "none", fontWeight: "bold" }}>Descargar Original</a>
                    </td>
                  </tr>
                );
              })}

              {/* Archivos Nuevos Propuestos */}
              {req.new_files_info && req.new_files_info.map((file) => (
                <tr key={`new-${file.aws_file_reference_id}`} style={{ background: '#e8f5e9' }}>
                  <td style={{ padding: "10px", border: "1px solid #ccc", color: '#2e7d32', fontWeight: 'bold' }}>
                    🆕 NUEVO
                  </td>
                  <td style={{ padding: "10px", border: "1px solid #ccc", fontWeight: 'bold', color: '#2e7d32' }}>
                    <FiFileText style={{ marginRight: '5px', verticalAlign: 'middle' }} />
                    {file.display_name}
                  </td>
                  <td style={{ padding: "10px", border: "1px solid #ccc" }}>{(file.file_size_bytes / 1024 / 1024).toFixed(2)} MB</td>
                  <td style={{ padding: "10px", border: "1px solid #ccc" }}>
                    <a href={file.file_url} target="_blank" rel="noopener noreferrer" style={{ color: "#4CAF50", textDecoration: "none", fontWeight: "bold" }}>Revisar Archivo</a>
                  </td>
                </tr>
              ))}

              {(!dataset.files || dataset.files.length === 0) && (!req.new_files_info || req.new_files_info.length === 0) && (
                <tr><td colSpan="4" style={{ padding: "15px", textAlign: "center", border: "1px solid #ccc" }}>No hay archivos registrados ni propuestos.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ÁREA DE VALIDACIÓN Y COMENTARIOS */}
      <div style={{ background: "#e3f2fd", padding: "20px", borderRadius: "8px", border: "1px solid #90caf9" }}>
        <h2 style={{ color: "#1565c0", marginTop: 0, marginBottom: "15px" }}>Resolución del Revisor</h2>
        
        <div style={{ marginBottom: "20px" }}>
          <label style={{ fontWeight: "bold", display: "block", marginBottom: "8px" }}>Comentario de Revisión (Requerido):</label>
          <textarea 
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            placeholder="Escribe aquí tu justificación para aprobar o rechazar esta solicitud. Este comentario se enviará al usuario y quedará registrado en auditoría..."
            style={{ width: "100%", padding: "12px", borderRadius: "4px", border: "1px solid #ccc", height: "100px", resize: "vertical" }}
            required
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "15px" }}>
          <button 
            onClick={() => handleAction('reject')}
            disabled={isSubmitting}
            style={{ padding: "12px 25px", background: "#f44336", color: "white", border: "none", borderRadius: "4px", cursor: isSubmitting ? "not-allowed" : "pointer", fontWeight: "bold", fontSize: "15px" }}>
            {isSubmitting ? "Procesando..." : "❌ RECHAZAR SOLICITUD"}
          </button>
          
          <button 
            onClick={() => handleAction('publish')}
            disabled={isSubmitting}
            style={{ padding: "12px 25px", background: "#4CAF50", color: "white", border: "none", borderRadius: "4px", cursor: isSubmitting ? "not-allowed" : "pointer", fontWeight: "bold", fontSize: "15px" }}>
            {isSubmitting ? "Procesando..." : "✅ APROBAR Y APLICAR"}
          </button>
        </div>
      </div>

    </div>
  );
}

export default ValidarDataset;