import { useState, useEffect } from "react";
import "../../Styles/Pages_styles/Admin/CrearDataset.css"; 
import { useAuth } from "../../Context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://3.139.202.192:3000";

function CrearDataset({ onCancel }) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth(); 

  const [categories, setCategories] = useState([]);
  const [licenses, setLicenses] = useState([]);
  const [instituciones, setInstituciones] = useState([]);
  const [odsList, setOdsList] = useState([]);
  const [tagsList, setTagsList] = useState([]);

  const [formData, setFormData] = useState({
    title: "", summary: "", description: "", category_id: "", license_id: "",
    institution_id: "", ods_objective_id: "", access_level: "public",
    creation_date: new Date().toISOString().split('T')[0], 
    temporal_coverage_start: "", temporal_coverage_end: "", geographic_coverage: "",
    update_frequency: "", source_url: "", tags: [] // <-- Añadido arreglo de tags
  });

  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [catRes, licRes, instRes, odsRes, tagsRes] = await Promise.all([
          fetch(`${API_URL}/api/categories`),
          fetch(`${API_URL}/api/licenses`),
          fetch(`${API_URL}/api/instituciones`, { headers: { "Authorization": `Bearer ${user.token}` } }),
          fetch(`${API_URL}/api/ods`),
          fetch(`${API_URL}/api/tags`)
        ]);

        if (catRes.ok) setCategories((await catRes.json()).data || []);
        if (licRes.ok) setLicenses((await licRes.json()).data || []);
        if (instRes.ok) setInstituciones((await instRes.json()).instituciones || []);
        if (odsRes.ok) setOdsList((await odsRes.json()).data || []);
        if (tagsRes.ok) setTagsList((await tagsRes.json()).data || []);
        
      } catch (error) { console.error("Error cargando opciones:", error); }
    };
    fetchOptions();
  }, [user.token]);

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

  const handleFileChange = (e) => setSelectedFiles(Array.from(e.target.files));
  const removeFile = (index) => setSelectedFiles(files => files.filter((_, i) => i !== index));

  const handleSubmit = async (e, status) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return alert("Debes subir al menos un archivo.");
    if (formData.tags.length === 0) return alert("Debes seleccionar al menos 1 etiqueta.");

    setIsSubmitting(true);
    try {
      const uploadedFilesData = [];
      for (const file of selectedFiles) {
        const presignedRes = await fetch(`${API_URL}/api/upload/presigned-url`, {
          method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${user.token}` },
          body: JSON.stringify({ fileName: file.name, contentType: file.type })
        });
        if (!presignedRes.ok) throw new Error("Error obteniendo URL de subida");
        const { uploadUrl, fileUrl, storageKey } = await presignedRes.json();

        const uploadRes = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
        if (!uploadRes.ok) throw new Error(`Error subiendo el archivo ${file.name}`);

        uploadedFilesData.push({
          storage_key: storageKey, file_url: fileUrl, display_name: file.name,
          file_format: file.name.split('.').pop().toLowerCase(), mime_type: file.type,
          file_size_bytes: file.size, file_role: 'source', is_primary: uploadedFilesData.length === 0 
        });
      }

      const payload = {
        ...formData,
        category_id: Number(formData.category_id),
        license_id: Number(formData.license_id),
        institution_id: formData.institution_id ? Number(formData.institution_id) : null,
        ods_objective_id: formData.ods_objective_id ? Number(formData.ods_objective_id) : null,
        source_url: formData.source_url?.trim() !== "" ? formData.source_url : null,
        temporal_coverage_start: formData.temporal_coverage_start !== "" ? formData.temporal_coverage_start : null,
        temporal_coverage_end: formData.temporal_coverage_end !== "" ? formData.temporal_coverage_end : null,
        geographic_coverage: formData.geographic_coverage?.trim() !== "" ? formData.geographic_coverage : null,
        update_frequency: formData.update_frequency !== "" ? formData.update_frequency : null,
        files: uploadedFilesData,
        dataset_status: status // 👈 AQUÍ INYECTAMOS EL ESTADO SOLICITADO
      };

      const res = await fetch(`${API_URL}/api/datasets`, { 
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${user.token}` },
        body: JSON.stringify(payload) 
      });

      if (!res.ok) throw new Error("Error al guardar el dataset");
      alert(`¡Dataset guardado como ${status === 'draft' ? 'Borrador' : 'Enviado a Validación'} con éxito!`);
      onCancel();

    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="crear-dataset-container">
      <div className="header">
        <button type="button" onClick={onCancel} className="btn-back-header">← Volver</button>
        <div><h1>Crear Nuevo Dataset</h1><p>Paso {step} de 2</p></div>
      </div>

      <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2); } : handleSubmit}>
        <div className={step === 1 ? "d-block" : "d-none"}>
          
          <div className="form-group"><label>Título del Dataset *</label><input type="text" name="title" required value={formData.title} onChange={handleChange} className="form-control" /></div>

          <div className="form-row">
            <div className="form-col"><label>Categoría *</label><select name="category_id" required value={formData.category_id} onChange={handleChange} className="form-control"><option value="">Seleccione...</option>{categories.map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}</select></div>
            <div className="form-col"><label>Licencia *</label><select name="license_id" required value={formData.license_id} onChange={handleChange} className="form-control"><option value="">Seleccione...</option>{licenses.map(l => <option key={l.license_id} value={l.license_id}>{l.name}</option>)}</select></div>
          </div>

          <div className="form-row">
            <div className="form-col"><label>Institución Responsable</label><select name="institution_id" value={formData.institution_id} onChange={handleChange} className="form-control"><option value="">Seleccione...</option>{instituciones.map(i => <option key={i.institution_id} value={i.institution_id}>{i.legal_name}</option>)}</select></div>
            
            {/* 👇 NUEVO: ODS (Opcional) */}
            <div className="form-col">
              <label>Objetivo ODS (Opcional)</label>
              <select name="ods_objective_id" value={formData.ods_objective_id} onChange={handleChange} className="form-control">
                <option value="">Ninguno</option>
                {/* Nota: Lee ods_objective_id respetando tu archivo 029_create_ods_objectives.sql */}
                {odsList.map(o => <option key={o.ods_objective_id || o.ods_id} value={o.ods_objective_id || o.ods_id}>{o.objective_code} - {o.objective_name || o.name}</option>)}
              </select>
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

          {/* Resto de campos resumidos por espacio en esta respuesta (Mantenlos igual que tu archivo original) */}
          <div className="form-row" style={{ marginTop: '15px' }}>
             <div className="form-col"><label>Fecha Creación *</label><input type="date" name="creation_date" required value={formData.creation_date} onChange={handleChange} className="form-control" /></div>
             <div className="form-col"><label>Nivel de Acceso</label><select name="access_level" value={formData.access_level} onChange={handleChange} className="form-control"><option value="public">Público</option><option value="internal">Interno</option></select></div>
          </div>

          <div className="form-group" style={{ marginTop: '15px' }}><label>Resumen Corto *</label><textarea name="summary" required maxLength="500" value={formData.summary} onChange={handleChange} className="form-control" /></div>
          <div className="form-group"><label>Descripción Completa *</label><textarea name="description" required value={formData.description} onChange={handleChange} className="form-control" style={{ minHeight: '100px' }}/></div>

          <div className="text-right" style={{ marginTop: '20px' }}>
            <button type="button" onClick={() => formData.tags.length === 0 ? alert("Selecciona al menos 1 etiqueta") : setStep(2)} className="btn-primary">Continuar a Archivos →</button>
          </div>
        </div>

        {/* PASO 2: ARCHIVOS Y ENVÍO */}
        <div className={step === 2 ? "d-block" : "d-none"}>
          
          <div className="file-drop-area">
            <input type="file" multiple onChange={handleFileChange} id="file-upload" className="d-none" />
            <label htmlFor="file-upload" className="file-upload-label">
              📁 Seleccionar archivos de tu equipo
            </label>
          </div>

          {/* 👇 NUEVO: Muestra los archivos seleccionados de forma bonita 👇 */}
          {selectedFiles.length > 0 && (
            <div className="file-list-container" style={{ marginTop: '20px' }}>
              <h3>Archivos listos para subir:</h3>
              <ul className="file-list" style={{ listStyle: 'none', padding: 0 }}>
                {selectedFiles.map((f, i) => (
                  <li key={i} style={{ display: 'flex', justifyContent: 'space-between', background: '#f1f8e9', padding: '10px 15px', marginBottom: '8px', borderRadius: '5px', border: '1px solid #c5e1a5' }}>
                    <span>📄 <strong>{f.name}</strong> <small>({(f.size / 1024 / 1024).toFixed(2)} MB)</small></span>
                    <button type="button" onClick={() => removeFile(i)} style={{ background: 'transparent', border: 'none', color: '#d32f2f', cursor: 'pointer', fontWeight: 'bold' }}>
                      ✖ Quitar
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="form-actions" style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between' }}>
            <button type="button" onClick={() => setStep(1)} className="btn-secondary">← Atrás</button>
            
            {/* 👇 NUEVO: Botones Duales 👇 */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                type="button" 
                onClick={(e) => handleSubmit(e, 'draft')} 
                disabled={isSubmitting || selectedFiles.length === 0} 
                className="btn-primary" 
                style={{backgroundColor: '#2196F3'}}
              >
                {isSubmitting ? '...' : 'Guardar Borrador'}
              </button>
              <button 
                type="button" 
                onClick={(e) => handleSubmit(e, 'pending_validation')} 
                disabled={isSubmitting || selectedFiles.length === 0} 
                className="btn-primary" 
                style={{backgroundColor: '#ff9800'}}
              >
                {isSubmitting ? 'Enviando...' : '🚀 Enviar a Validación'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
export default CrearDataset;