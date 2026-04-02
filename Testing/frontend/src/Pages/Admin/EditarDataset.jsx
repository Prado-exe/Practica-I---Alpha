import { useState, useEffect } from "react";
import "../../Styles/Pages_styles/Admin/CrearDataset.css"; 
import "../../Styles/Pages_styles/Admin/GestionDatasets.css"; 
import { useAuth } from "../../Context/AuthContext"; 

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function EditarDataset({ datasetId, onCancel }) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth(); 

  // OPCIONES DE SELECTS
  const [categories, setCategories] = useState([]);
  const [licenses, setLicenses] = useState([]);
  const [instituciones, setInstituciones] = useState([]);
  const [originalStatus, setOriginalStatus] = useState(""); 

  // ESTADOS DE ARCHIVOS (Lógica de la 2da versión)
  const [existingFiles, setExistingFiles] = useState([]); 
  const [deletedFileIds, setDeletedFileIds] = useState([]); 
  const [newFiles, setNewFiles] = useState([]); 

  const [formData, setFormData] = useState({
    title: "", summary: "", description: "", category_id: "", license_id: "", institution_id: "", 
    access_level: "public", creation_date: "", temporal_coverage_start: "", temporal_coverage_end: "",
    geographic_coverage: "", update_frequency: "", source_url: "", dataset_status: ""
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [catRes, licRes, instRes, dsRes] = await Promise.all([
          fetch(`${API_URL}/api/categories`),
          fetch(`${API_URL}/api/licenses`),
          fetch(`${API_URL}/api/instituciones`, { headers: { "Authorization": `Bearer ${user.token}` } }),
          fetch(`${API_URL}/api/datasets/${datasetId}`, { headers: { "Authorization": `Bearer ${user.token}` } })
        ]);

        if (catRes.ok) setCategories((await catRes.json()).data || []);
        if (licRes.ok) setLicenses((await licRes.json()).data || []);
        if (instRes.ok) setInstituciones((await instRes.json()).instituciones || []);

        if (dsRes.ok) {
          const { data } = await dsRes.json();
          setOriginalStatus(data.dataset_status);
          if (data.files) setExistingFiles(data.files);

          setFormData({
            title: data.title || "",
            summary: data.summary || "",
            description: data.description || "",
            category_id: data.category_id || "",
            license_id: data.license_id || "",
            institution_id: data.institution_id || "", 
            access_level: data.access_level || "public",
            creation_date: data.creation_date ? data.creation_date.split('T')[0] : "", 
            temporal_coverage_start: data.temporal_coverage_start ? data.temporal_coverage_start.split('T')[0] : "",
            temporal_coverage_end: data.temporal_coverage_end ? data.temporal_coverage_end.split('T')[0] : "",
            geographic_coverage: data.geographic_coverage || "",
            update_frequency: data.update_frequency || "",
            source_url: data.source_url || "",
            dataset_status: data.dataset_status || ""
          });
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [datasetId, user.token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // MÉTODOS DE ARCHIVOS
  const handleNewFileChange = (e) => setNewFiles(Array.from(e.target.files));
  const removeNewFile = (indexToRemove) => setNewFiles(files => files.filter((_, index) => index !== indexToRemove));
  const removeExistingFile = (fileId) => {
    setDeletedFileIds(prev => [...prev, fileId]);
    setExistingFiles(files => files.filter(f => f.aws_file_reference_id !== fileId));
  };

  const handleSubmit = async (e, forcedStatus = null) => {
    if (e) e.preventDefault();

    if (existingFiles.length === 0 && newFiles.length === 0) {
      return alert("El dataset debe tener al menos un archivo válido.");
    }

    setIsSubmitting(true);

    try {
      // 1. Subida de nuevos archivos
      const uploadedFilesData = [];
      for (const file of newFiles) {
        const presignedRes = await fetch(`${API_URL}/api/upload/presigned-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${user.token}` },
          body: JSON.stringify({ fileName: file.name, contentType: file.type })
        });
        const { uploadUrl, fileUrl, storageKey } = await presignedRes.json();
        
        await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });

        uploadedFilesData.push({
          storage_key: storageKey, file_url: fileUrl, display_name: file.name,
          file_format: file.name.split('.').pop().toLowerCase(), mime_type: file.type,
          file_size_bytes: file.size, file_role: 'source'
        });
      }

      // 2. Payload Unificado
      const payload = {
        ...formData,
        category_id: Number(formData.category_id),
        license_id: Number(formData.license_id),
        institution_id: formData.institution_id ? Number(formData.institution_id) : null,
        dataset_status: forcedStatus || formData.dataset_status,
        new_files: uploadedFilesData,
        deleted_file_ids: deletedFileIds 
      };

      const res = await fetch(`${API_URL}/api/datasets/${datasetId}`, { 
        method: "PUT", 
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${user.token}` },
        body: JSON.stringify(payload) 
      });

      if (!res.ok) throw new Error("Error al actualizar el dataset");
      
      alert("¡Dataset actualizado con éxito!");
      onCancel();
    } catch (error) {
      alert(error.message || "Ocurrió un error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="crear-dataset-container"><h2>Cargando...</h2></div>;

  return (
    <div className="crear-dataset-container">
      <div className="header">
        <button type="button" onClick={onCancel} className="btn-back-header">← Volver</button>
        <div>
          <h1>Editar Dataset #{datasetId}</h1>
          <p>Paso {step} de 2: {step === 1 ? 'Metadatos' : 'Gestión de Archivos'}</p>
        </div>
      </div>

      <div className="status-alert" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span><strong>Editando:</strong> {formData.title}</span>
        <span><strong>Estado:</strong> <span className="status-text">{originalStatus}</span></span>
      </div>

      <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2); } : (e) => handleSubmit(e)}>
        
        {/* PASO 1: METADATOS */}
        <div className={step === 1 ? "d-block" : "d-none"}>
          <div className="form-group">
            <label>Título del Dataset *</label>
            <input type="text" name="title" required value={formData.title} onChange={handleChange} className="form-control" />
          </div>

          <div className="form-row">
            <div className="form-col">
              <label>Categoría *</label>
              <select name="category_id" required value={formData.category_id} onChange={handleChange} className="form-control">
                <option value="">Seleccione...</option>
                {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-col">
              <label>Licencia *</label>
              <select name="license_id" required value={formData.license_id} onChange={handleChange} className="form-control">
                <option value="">Seleccione...</option>
                {licenses.map(l => <option key={l.license_id} value={l.license_id}>{l.name}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-col">
              <label>Institución</label>
              <select name="institution_id" value={formData.institution_id} onChange={handleChange} className="form-control">
                <option value="">Seleccione...</option>
                {instituciones.map(inst => <option key={inst.institution_id} value={inst.institution_id}>{inst.legal_name || inst.name}</option>)}
              </select>
            </div>
            <div className="form-col">
              <label>Fecha Creación *</label>
              <input type="date" name="creation_date" required value={formData.creation_date} onChange={handleChange} className="form-control" />
            </div>
          </div>

          <div className="form-group">
            <label>Resumen Corto *</label>
            <textarea name="summary" required maxLength="500" value={formData.summary} onChange={handleChange} className="form-control textarea-short" />
          </div>

          <div className="form-group-large">
            <label>Descripción Completa *</label>
            <textarea name="description" required value={formData.description} onChange={handleChange} className="form-control textarea-long" />
          </div>

          <div className="text-right">
            <button type="submit" className="btn-primary">Continuar a Archivos →</button>
          </div>
        </div>

        {/* PASO 2: ARCHIVOS */}
        <div className={step === 2 ? "d-block" : "d-none"}>
          
          {/* Archivos Existentes */}
          <div className="file-list-container">
            <h3>Archivos Actuales:</h3>
            <ul className="file-list">
              {existingFiles.map((f) => (
                <li key={f.aws_file_reference_id} className="file-item" style={{backgroundColor: '#e3f2fd'}}>
                  <span>📄 {f.display_name}</span>
                  <button type="button" onClick={() => removeExistingFile(f.aws_file_reference_id)} className="btn-remove-file">🗑️</button>
                </li>
              ))}
            </ul>
          </div>

          {/* Subir Nuevos */}
          <div className="file-drop-area">
            <input type="file" multiple onChange={handleNewFileChange} id="file-upload" className="d-none" />
            <label htmlFor="file-upload" className="file-upload-label">📁 Añadir nuevos archivos</label>
          </div>

          {newFiles.length > 0 && (
            <div className="file-list-container">
              <h3>Nuevos para subir:</h3>
              <ul className="file-list">
                {newFiles.map((f, i) => (
                  <li key={i} className="file-item" style={{backgroundColor: '#f1f8e9'}}>
                    <span>🆕 {f.name}</span>
                    <button type="button" onClick={() => removeNewFile(i)} className="btn-remove-file">✖</button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="form-actions" style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between' }}>
            <button type="button" onClick={() => setStep(1)} className="btn-secondary">← Atrás</button>
            <div style={{ display: 'flex', gap: '10px' }}>
              {originalStatus === 'draft' ? (
                <>
                  <button type="button" onClick={(e) => handleSubmit(e, 'draft')} disabled={isSubmitting} className="btn-primary" style={{backgroundColor: '#2196F3'}}>
                    {isSubmitting ? '...' : 'Guardar Borrador'}
                  </button>
                  <button type="button" onClick={(e) => handleSubmit(e, 'pending_validation')} disabled={isSubmitting} className="btn-primary" style={{backgroundColor: '#ff9800'}}>
                    🚀 Enviar a Validación
                  </button>
                </>
              ) : (
                <button type="submit" disabled={isSubmitting} className="btn-primary">
                  {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default EditarDataset;