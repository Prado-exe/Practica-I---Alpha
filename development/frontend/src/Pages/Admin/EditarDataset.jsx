import { useState, useEffect } from "react";
import "../../Styles/Pages_styles/Admin/CrearDataset.css"; 
import "../../Styles/Pages_styles/Admin/GestionDatasets.css"; 
import { useAuth } from "../../Context/AuthContext"; 

const API_URL = import.meta.env.VITE_API_URL || "http://3.139.202.192:3000";

function EditarDataset({ datasetId, onCancel }) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth(); 

  // OPCIONES DE SELECTS
  const [categories, setCategories] = useState([]);
  const [licenses, setLicenses] = useState([]);
  const [instituciones, setInstituciones] = useState([]);
  const [odsList, setOdsList] = useState([]); // 👈 NUEVO
  const [tagsList, setTagsList] = useState([]); // 👈 NUEVO
  const [originalStatus, setOriginalStatus] = useState(""); 

  // ESTADOS DE ARCHIVOS
  const [existingFiles, setExistingFiles] = useState([]); 
  const [deletedFileIds, setDeletedFileIds] = useState([]); 
  const [newFiles, setNewFiles] = useState([]); 

  const [formData, setFormData] = useState({
    title: "", summary: "", description: "", category_id: "", license_id: "", institution_id: "", 
    ods_objective_id: "", tags: [], // 👈 NUEVOS CAMPOS
    access_level: "public", creation_date: "", temporal_coverage_start: "", temporal_coverage_end: "",
    geographic_coverage: "", update_frequency: "", source_url: "", dataset_status: ""
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [catRes, licRes, instRes, odsRes, tagsRes, dsRes] = await Promise.all([
          fetch(`${API_URL}/api/categories`),
          fetch(`${API_URL}/api/licenses`),
          fetch(`${API_URL}/api/instituciones`, { headers: { "Authorization": `Bearer ${user.token}` } }),
          fetch(`${API_URL}/api/ods`), // 👈 NUEVO
          fetch(`${API_URL}/api/tags`), // 👈 NUEVO
          fetch(`${API_URL}/api/datasets/${datasetId}`, { headers: { "Authorization": `Bearer ${user.token}` } })
        ]);

        if (catRes.ok) setCategories((await catRes.json()).data || []);
        if (licRes.ok) setLicenses((await licRes.json()).data || []);
        if (instRes.ok) setInstituciones((await instRes.json()).instituciones || []);
        if (odsRes.ok) setOdsList((await odsRes.json()).data || []);
        if (tagsRes.ok) setTagsList((await tagsRes.json()).data || []);

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
            ods_objective_id: data.ods_objective_id || "", // 👈 NUEVO
            tags: data.tags ? data.tags.map(t => t.tag_id || t) : [], // 👈 NUEVO (Soporta arreglo de IDs o de objetos)
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

  const handleAddTag = (e) => {
    const tagId = Number(e.target.value);
    if (!tagId) return;
    
    setFormData(prev => {
      if (prev.tags.length >= 5) {
        alert("Máximo 5 etiquetas permitidas.");
        return prev;
      }
      if (prev.tags.includes(tagId)) return prev;
      return { ...prev, tags: [...prev.tags, tagId] };
    });
  };

  const handleRemoveTag = (tagIdToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(id => id !== tagIdToRemove)
    }));
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

    if (existingFiles.length === 0 && newFiles.length === 0) return alert("El dataset debe tener al menos un archivo válido.");
    if (formData.tags.length === 0) return alert("Debes seleccionar al menos 1 etiqueta."); // 👈 NUEVO

    setIsSubmitting(true);

    try {
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

      const payload = {
        ...formData,
        category_id: Number(formData.category_id),
        license_id: Number(formData.license_id),
        institution_id: formData.institution_id ? Number(formData.institution_id) : null,
        ods_objective_id: formData.ods_objective_id ? Number(formData.ods_objective_id) : null, // 👈 NUEVO
        tags: formData.tags, // 👈 NUEVO
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
            {/* 👇 NUEVO: Selector de ODS */}
            <div className="form-col">
              <label>Objetivo ODS (Opcional)</label>
              <select name="ods_objective_id" value={formData.ods_objective_id} onChange={handleChange} className="form-control">
                <option value="">Ninguno</option>
                {odsList.map(o => <option key={o.ods_objective_id || o.ods_id} value={o.ods_objective_id || o.ods_id}>{o.objective_code} - {o.objective_name || o.name}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row" style={{ marginTop: "15px" }}>
            <div className="form-col">
              <label>Fecha Creación *</label>
              <input type="date" name="creation_date" required value={formData.creation_date} onChange={handleChange} className="form-control" />
            </div>
          </div>

          {/* 👇 NUEVO: ETIQUETAS (Selector + Chips) */}
          <div className="form-group" style={{ marginTop: '15px' }}>
            <label>Etiquetas (Seleccionadas: {formData.tags.length}/5) *</label>
            
            {/* 1. Selector Desplegable */}
            <select 
              className="form-control" 
              value="" 
              onChange={handleAddTag}
              disabled={formData.tags.length >= 5}
            >
              <option value="">
                {formData.tags.length >= 5 ? "Límite de 5 alcanzado" : "-- Selecciona una etiqueta para añadirla --"}
              </option>
              {tagsList
                .filter(tag => !formData.tags.includes(tag.tag_id)) // Oculta las que ya están seleccionadas
                .map(tag => (
                  <option key={tag.tag_id} value={tag.tag_id}>{tag.name}</option>
              ))}
            </select>

            {/* 2. Chips Visuales (Píldoras) */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
              {formData.tags.map(tagId => {
                // 👇 CAMBIO CLAVE AQUÍ: Forzamos todo a String para que no haya falsos negativos
                const tagObj = tagsList.find(t => String(t.tag_id) === String(tagId));
                
                return (
                  <div key={tagId} style={{
                    display: 'flex', alignItems: 'center', background: '#0056b3', color: 'white',
                    padding: '5px 12px', borderRadius: '15px', fontSize: '13px'
                  }}>
                    {/* 👇 Si lo encuentra, muestra el nombre, si no, se protege mostrando el ID temporalmente */}
                    {tagObj ? tagObj.name : `Etiqueta #${tagId}`}
                    <button 
                      type="button" 
                      onClick={() => handleRemoveTag(tagId)} 
                      style={{ 
                        background: 'transparent', border: 'none', color: 'white', 
                        marginLeft: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' 
                      }}
                      title="Quitar etiqueta"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
            {formData.tags.length === 0 && <small style={{color: '#d32f2f', display: 'block', marginTop: '5px'}}>* Selecciona al menos 1 etiqueta para continuar.</small>}
          </div>

          <div className="form-group" style={{ marginTop: "15px" }}>
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

        {/* PASO 2: ARCHIVOS (Se mantiene intacto) */}
        <div className={step === 2 ? "d-block" : "d-none"}>
          
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