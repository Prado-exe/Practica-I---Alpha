import { useState, useEffect } from "react";
import { useAuth } from "../../Context/AuthContext";
import "../../Styles/Pages_styles/Admin/GestionDatasets.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function EditarDatasetUsuario({ datasetId, onCancel }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [categories, setCategories] = useState([]);
  const [licenses, setLicenses] = useState([]);
  const [odsList, setOdsList] = useState([]);
  const [tagsList, setTagsList] = useState([]);

  // Archivos
  const [existingFiles, setExistingFiles] = useState([]);
  const [deletedFileIds, setDeletedFileIds] = useState([]);
  const [newSelectedFiles, setNewSelectedFiles] = useState([]);

  const [formData, setFormData] = useState({
    title: "", summary: "", description: "", category_id: "", license_id: "",
    institution_id: "", institution_name: "", ods_objective_id: "", access_level: "public",
    creation_date: "", temporal_coverage_start: "", temporal_coverage_end: "",
    geographic_coverage: "", update_frequency: "", source_url: "",
    tags: []
  });

  useEffect(() => {
    const initLoad = async () => {
      try {
        const [catRes, licRes, tagsRes, odsRes, dsRes] = await Promise.all([
          fetch(`${API_URL}/api/categories`),
          fetch(`${API_URL}/api/licenses`),
          fetch(`${API_URL}/api/tags`),
          fetch(`${API_URL}/api/ods`),
          fetch(`${API_URL}/api/datasets/${datasetId}`, { headers: { "Authorization": `Bearer ${user.token}` } })
        ]);

        if (catRes.ok) setCategories((await catRes.json()).data || []);
        if (licRes.ok) setLicenses((await licRes.json()).data || []);
        if (tagsRes.ok) {
          const tagsJson = await tagsRes.json();
          setTagsList(tagsJson.data || tagsJson.tags || []);
        }
        if (odsRes.ok) {
          const odsJson = await odsRes.json();
          setOdsList(odsJson.data || odsJson.ods || []);
        }

        if (dsRes.ok) {
          const ds = (await dsRes.json()).data;
          setFormData({
            ...ds,
            institution_id: String(ds.institution_id || ""),
            category_id: String(ds.category_id || ""),
            license_id: String(ds.license_id || ""),
            ods_objective_id: String(ds.ods_objective_id || ""),
            tags: ds.tags?.map(t => t.tag_id) || [],
            creation_date: ds.creation_date ? ds.creation_date.split('T')[0] : "",
            temporal_coverage_start: ds.temporal_coverage_start ? ds.temporal_coverage_start.split('T')[0] : "",
            temporal_coverage_end: ds.temporal_coverage_end ? ds.temporal_coverage_end.split('T')[0] : "",
            geographic_coverage: ds.geographic_coverage || "",
            update_frequency: ds.update_frequency || "",
            source_url: ds.source_url || ""
          });
          setExistingFiles(ds.files || []);
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };
    initLoad();
  }, [datasetId, user.token]);

  // Manejo de Inputs
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // Manejo de Etiquetas
  const handleAddTag = (e) => {
    const tagId = Number(e.target.value);
    if (!tagId) return;
    setFormData(prev => {
      if (prev.tags.length >= 5) { alert("Máximo 5 etiquetas."); return prev; }
      if (prev.tags.includes(tagId)) return prev;
      return { ...prev, tags: [...prev.tags, tagId] };
    });
  };
  const handleRemoveTag = (tagIdToRemove) => setFormData(prev => ({ ...prev, tags: prev.tags.filter(id => id !== tagIdToRemove) }));

  // Manejo de Archivos
  const handleRemoveExistingFile = (fileRefId) => {
    if (window.confirm("¿Seguro que deseas marcar este archivo para eliminación?")) {
      setDeletedFileIds(prev => [...prev, fileRefId]);
      setExistingFiles(prev => prev.filter(f => f.aws_file_reference_id !== fileRefId));
    }
  };
  const handleNewFileChange = (e) => setNewSelectedFiles(Array.from(e.target.files));
  const removeNewFile = (index) => setNewSelectedFiles(files => files.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (existingFiles.length === 0 && newSelectedFiles.length === 0) return alert("Debe existir al menos un archivo en el dataset.");
    if (formData.tags.length === 0) return alert("Debes seleccionar al menos 1 etiqueta.");

    setIsSubmitting(true);
    try {
      // 1. Subir archivos nuevos a S3
      const uploadedFilesData = [];
      for (const file of newSelectedFiles) {
        const presignedRes = await fetch(`${API_URL}/api/upload/presigned-url/user`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${user.token}` },
          body: JSON.stringify({ fileName: file.name, contentType: file.type })
        });
        if (!presignedRes.ok) throw new Error("Error obteniendo URL de subida");
        const { uploadUrl, fileUrl, storageKey } = await presignedRes.json();

        const uploadRes = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
        if (!uploadRes.ok) throw new Error(`Error subiendo el archivo ${file.name}`);

        uploadedFilesData.push({
          storage_key: storageKey, file_url: fileUrl, display_name: file.name,
          file_format: file.name.split('.').pop().toLowerCase(), mime_type: file.type,
          file_size_bytes: file.size, file_role: 'source'
        });
      }

      // 2. Construir Payload (Convirtiendo strings vacíos a null para BD)
      const payload = {
        ...formData,
        category_id: Number(formData.category_id),
        license_id: Number(formData.license_id),
        ods_objective_id: formData.ods_objective_id ? Number(formData.ods_objective_id) : null,
        institution_id: formData.institution_id ? Number(formData.institution_id) : null,
        temporal_coverage_start: formData.temporal_coverage_start !== "" ? formData.temporal_coverage_start : null,
        temporal_coverage_end: formData.temporal_coverage_end !== "" ? formData.temporal_coverage_end : null,
        geographic_coverage: formData.geographic_coverage?.trim() !== "" ? formData.geographic_coverage : null,
        update_frequency: formData.update_frequency !== "" ? formData.update_frequency : null,
        source_url: formData.source_url?.trim() !== "" ? formData.source_url : null,
        files: uploadedFilesData, // Archivos nuevos
        deleted_file_ids: deletedFileIds // Archivos a borrar
      };

      // 3. Enviar al backend
      const res = await fetch(`${API_URL}/api/datasets/${datasetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${user.token}` },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Error al actualizar.");
      }
      
      alert("Tu solicitud de edición ha sido enviada con éxito.");
      onCancel();
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div style={{textAlign:'center', padding:'50px'}}>Cargando...</div>;

  return (
    <div className="gestion-datasets" style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <h1>Editar Dataset</h1>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px', background: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
          <label style={{ fontWeight: 'bold' }}>Institución Responsable (Bloqueado)</label>
          <input type="text" disabled value={formData.institution_name || "Tu Institución"} style={{ width: '100%', padding: '8px', cursor: 'not-allowed' }} />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Título del Dataset *</label>
          <input type="text" name="title" required value={formData.title} onChange={handleChange} style={{ width: '100%', padding: '8px' }} />
        </div>

        <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
          <div style={{ flex: 1 }}>
            <label>Fecha de Creación *</label>
            <input type="date" name="creation_date" required value={formData.creation_date} onChange={handleChange} style={{ width: '100%', padding: '8px' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label>Frecuencia de Actualización</label>
            <select name="update_frequency" value={formData.update_frequency} onChange={handleChange} style={{ width: '100%', padding: '8px' }}>
              <option value="">No definida</option>
              <option value="Anual">Anual</option>
              <option value="Semestral">Semestral</option>
              <option value="Mensual">Mensual</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
          <div style={{ flex: 1 }}>
            <label>Categoría *</label>
            <select name="category_id" required value={formData.category_id} onChange={handleChange} style={{ width: '100%', padding: '8px' }}>
              <option value="">Seleccione...</option>
              {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label>Licencia *</label>
            <select name="license_id" required value={formData.license_id} onChange={handleChange} style={{ width: '100%', padding: '8px' }}>
              <option value="">Seleccione...</option>
              {licenses.map(l => <option key={l.license_id} value={l.license_id}>{l.name}</option>)}
            </select>
          </div>
        </div>

        {/* ETIQUETAS */}
        <div style={{ marginBottom: '15px' }}>
          <label>Etiquetas (Seleccionadas: {formData.tags.length}/5) *</label>
          <select value="" onChange={handleAddTag} disabled={formData.tags.length >= 5} style={{ width: '100%', padding: '8px', marginBottom: '10px' }}>
            <option value="">{formData.tags.length >= 5 ? "Límite alcanzado" : "-- Selecciona una etiqueta --"}</option>
            {tagsList.filter(tag => !formData.tags.includes(tag.tag_id)).map(tag => (
                <option key={tag.tag_id} value={tag.tag_id}>{tag.name}</option>
            ))}
          </select>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {formData.tags.map(tagId => {
              const tagObj = tagsList.find(t => String(t.tag_id) === String(tagId));
              return (
                <div key={tagId} style={{ display: 'flex', alignItems: 'center', background: '#0056b3', color: 'white', padding: '5px 12px', borderRadius: '15px', fontSize: '13px' }}>
                  {tagObj ? tagObj.name : `Tag #${tagId}`}
                  <button type="button" onClick={() => handleRemoveTag(tagId)} style={{ background: 'none', border: 'none', color: 'white', marginLeft: '8px', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
          <div style={{ flex: 1 }}>
            <label>ODS Relacionado</label>
            <select name="ods_objective_id" value={formData.ods_objective_id} onChange={handleChange} style={{ width: '100%', padding: '8px' }}>
              <option value="">Ninguno</option>
              {odsList.map(o => <option key={o.ods_objective_id || o.ods_id} value={o.ods_objective_id || o.ods_id}>{o.objective_code} - {o.objective_name || o.name}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label>URL de la Fuente</label>
            <input type="url" name="source_url" placeholder="https://..." value={formData.source_url} onChange={handleChange} style={{ width: '100%', padding: '8px' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
          <div style={{ flex: 1 }}>
            <label>Cobertura Temporal (Inicio)</label>
            <input type="date" name="temporal_coverage_start" value={formData.temporal_coverage_start} onChange={handleChange} style={{ width: '100%', padding: '8px' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label>Cobertura Temporal (Término)</label>
            <input type="date" name="temporal_coverage_end" value={formData.temporal_coverage_end} onChange={handleChange} style={{ width: '100%', padding: '8px' }} />
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Resumen Corto *</label>
          <textarea name="summary" required maxLength="500" value={formData.summary} onChange={handleChange} style={{ width: '100%', padding: '8px', height: '60px' }} />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label>Descripción Completa *</label>
          <textarea name="description" required value={formData.description} onChange={handleChange} style={{ width: '100%', padding: '8px', height: '120px' }} />
        </div>

        {/* GESTIÓN DE ARCHIVOS */}
        <div style={{ marginBottom: '25px', padding: '15px', background: '#f9f9f9', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h3 style={{ marginTop: 0 }}>Archivos Actuales del Dataset</h3>
          {existingFiles.length === 0 ? <p style={{ color: '#666' }}>No hay archivos actualmente.</p> : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {existingFiles.map((f) => (
                <li key={f.aws_file_reference_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid #eee' }}>
                  <span>📄 {f.display_name}</span>
                  <button type="button" onClick={() => handleRemoveExistingFile(f.aws_file_reference_id)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold' }}>🗑️ Eliminar</button>
                </li>
              ))}
            </ul>
          )}

          <h3 style={{ marginTop: '20px' }}>Añadir Nuevos Archivos</h3>
          <input type="file" multiple onChange={handleNewFileChange} />
          {newSelectedFiles.length > 0 && (
            <ul style={{ listStyle: 'none', padding: 0, marginTop: '10px' }}>
              {newSelectedFiles.map((f, i) => (
                <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: '#e3f2fd', marginBottom: '5px' }}>
                  <span>➕ {f.name} ({(f.size / 1024 / 1024).toFixed(2)} MB)</span>
                  <button type="button" onClick={() => removeNewFile(i)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>✖</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" onClick={onCancel} style={{ padding: '10px 20px', cursor: 'pointer' }}>Cancelar</button>
          <button type="submit" disabled={isSubmitting} style={{ padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
            {isSubmitting ? "Enviando..." : "Enviar Solicitud de Edición"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditarDatasetUsuario;