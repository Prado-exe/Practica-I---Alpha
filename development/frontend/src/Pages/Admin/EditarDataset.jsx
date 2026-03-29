import { useState, useEffect } from "react";
import "../../Styles/Pages_styles/Admin/CrearDataset.css"; 
import { useAuth } from "../../Context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// 1. Ahora recibimos 'dataset' (el objeto completo) en lugar de 'datasetId'
function EditarDataset({ dataset, onCancel }) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth(); 

  const [categories, setCategories] = useState([]);
  const [licenses, setLicenses] = useState([]);
  const [instituciones, setInstituciones] = useState([]);

  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    description: "",
    category_id: "",
    license_id: "",
    institution_id: "", 
    access_level: "public",
    creation_date: "", 
    temporal_coverage_start: "",
    temporal_coverage_end: "",
    geographic_coverage: "",
    update_frequency: "",
    source_url: ""
  });

  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    const fetchOptions = async () => {
      setIsLoading(true);
      try {
        // Solo pedimos las opciones de los selects (Categorías, Licencias, Instituciones)
        const [catRes, licRes, instRes] = await Promise.all([
          fetch(`${API_URL}/api/categories`),
          fetch(`${API_URL}/api/licenses`),
          fetch(`${API_URL}/api/instituciones`, { headers: { "Authorization": `Bearer ${user.token}` } })
        ]);

        if (catRes.ok) setCategories((await catRes.json()).data || []);
        if (licRes.ok) setLicenses((await licRes.json()).data || []);
        if (instRes.ok) setInstituciones((await instRes.json()).instituciones || []);

        // 2. Usamos el objeto 'dataset' que llegó por props para pre-llenar todo
        if (dataset) {
          console.log("Precargando desde la tabla:", dataset);
          setFormData({
            title: dataset.title || dataset.nombre || "",
            summary: dataset.summary || "",
            description: dataset.description || "",
            category_id: dataset.category_id || "",
            license_id: dataset.license_id || "",
            institution_id: dataset.institution_id || "", 
            access_level: dataset.access_level || "public",
            
            // Manejamos las fechas con cuidado de que no sean nulas
            creation_date: dataset.creation_date ? dataset.creation_date.split('T')[0] : (dataset.fecha ? dataset.fecha.split('T')[0] : ""), 
            temporal_coverage_start: dataset.temporal_coverage_start ? dataset.temporal_coverage_start.split('T')[0] : "",
            temporal_coverage_end: dataset.temporal_coverage_end ? dataset.temporal_coverage_end.split('T')[0] : "",
            
            geographic_coverage: dataset.geographic_coverage || "",
            update_frequency: dataset.update_frequency || "",
            source_url: dataset.source_url || ""
          });
        }

      } catch (error) {
        console.error("Error cargando opciones de selects:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOptions();
  }, [user.token, dataset]); // Dependemos de que 'dataset' exista

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

  const removeFile = (indexToRemove) => {
    setSelectedFiles(files => files.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const uploadedFilesData = [];

      // Subida de archivos (solo si hay nuevos)
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const presignedRes = await fetch(`${API_URL}/api/upload/presigned-url`, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json", 
              "Authorization": `Bearer ${user.token}` 
            },
            body: JSON.stringify({ fileName: file.name, contentType: file.type })
          });
          
          if (!presignedRes.ok) throw new Error("Error obteniendo URL de subida");
          const { uploadUrl, fileUrl, storageKey } = await presignedRes.json();

          const uploadRes = await fetch(uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": file.type },
            body: file
          });
          
          if (!uploadRes.ok) throw new Error(`Error subiendo el archivo ${file.name}`);

          uploadedFilesData.push({
            storage_key: storageKey,
            file_url: fileUrl,
            display_name: file.name,
            file_format: file.name.split('.').pop().toLowerCase(),
            mime_type: file.type,
            file_size_bytes: file.size,
            file_role: 'source',
            is_primary: uploadedFilesData.length === 0 
          });
        }
      }

      const payload = {
        ...formData,
        category_id: Number(formData.category_id),
        license_id: Number(formData.license_id),
        institution_id: formData.institution_id ? Number(formData.institution_id) : null,
        source_url: formData.source_url?.trim() !== "" ? formData.source_url : null,
        temporal_coverage_start: formData.temporal_coverage_start !== "" ? formData.temporal_coverage_start : null,
        temporal_coverage_end: formData.temporal_coverage_end !== "" ? formData.temporal_coverage_end : null,
        geographic_coverage: formData.geographic_coverage?.trim() !== "" ? formData.geographic_coverage : null,
        update_frequency: formData.update_frequency !== "" ? formData.update_frequency : null,
      };

      if (uploadedFilesData.length > 0) {
        payload.files = uploadedFilesData;
      }

      // 3. Obtenemos el ID del dataset original para hacer el PUT
      const actualDatasetId = dataset.dataset_id || dataset.id;

      const res = await fetch(`${API_URL}/api/datasets/${actualDatasetId}`, { 
        method: "PUT", 
        headers: { 
          "Content-Type": "application/json", 
          "Authorization": `Bearer ${user.token}` 
        },
        body: JSON.stringify(payload) 
      });

      if (!res.ok) {
        const err = await res.json();
        let errorMsg = "Error del servidor al actualizar el dataset";
        if (Array.isArray(err.message)) {
          errorMsg = err.message.map(e => e.message).join(", ");
        } else if (err.message) {
          errorMsg = err.message;
        }
        throw new Error(errorMsg);
      }
      
      alert("¡Dataset actualizado con éxito!");
      onCancel();

    } catch (error) {
      console.error(error);
      alert(error.message || "Ocurrió un error al procesar la solicitud.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="crear-dataset-container"><h2>Cargando opciones...</h2></div>;
  }

  return (
    <div className="crear-dataset-container">
      
      <div className="header">
        <button type="button" onClick={onCancel} className="btn-back-header">← Volver</button>
        <div>
          <h1>Editar Dataset</h1>
          <p>Paso {step} de 2: {step === 1 ? 'Actualizar Metadatos descriptivos' : 'Actualizar Archivos'}</p>
        </div>
      </div>

      <div className="status-alert">
        <strong>Editando:</strong> <span className="status-text">{formData.title || "Dataset"}</span>
      </div>

      <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2); } : handleSubmit}>
        
        {/* PASO 1: METADATOS */}
        <div className={step === 1 ? "d-block" : "d-none"}>
          
          <div className="form-group">
            <label>Título del Dataset *</label>
            <input type="text" name="title" required value={formData.title} onChange={handleChange} className="form-control" />
          </div>

          <div className="form-row">
            <div className="form-col">
              <label>Fecha de Creación de los Datos *</label>
              <input type="date" name="creation_date" required value={formData.creation_date} onChange={handleChange} className="form-control" />
            </div>
            <div className="form-col">
              <label>Frecuencia de Actualización</label>
              <select name="update_frequency" value={formData.update_frequency} onChange={handleChange} className="form-control">
                <option value="">No definida</option>
                <option value="Anual">Anual</option>
                <option value="Semestral">Semestral</option>
                <option value="Trimestral">Trimestral</option>
                <option value="Mensual">Mensual</option>
              </select>
            </div>
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
              <label>Institución Responsable</label>
              <select name="institution_id" value={formData.institution_id} onChange={handleChange} className="form-control">
                <option value="">Seleccione...</option>
                {instituciones.map(inst => (
                  <option key={inst.institution_id} value={inst.institution_id}>{inst.legal_name || inst.name}</option>
                ))}
              </select>
            </div>
            <div className="form-col">
              <label>Nivel de Acceso</label>
              <select name="access_level" value={formData.access_level} onChange={handleChange} className="form-control">
                <option value="public">Público (Cualquiera)</option>
                <option value="internal">Interno (Registrados)</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-col">
              <label>Cobertura Temporal (Inicio)</label>
              <input type="date" name="temporal_coverage_start" value={formData.temporal_coverage_start} onChange={handleChange} className="form-control" />
            </div>
            <div className="form-col">
              <label>Cobertura Temporal (Término)</label>
              <input type="date" name="temporal_coverage_end" value={formData.temporal_coverage_end} onChange={handleChange} className="form-control" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-col">
              <label>Cobertura Geográfica</label>
              <input type="text" name="geographic_coverage" placeholder="Ej: Chile, Regional..." value={formData.geographic_coverage} onChange={handleChange} className="form-control" />
            </div>
            <div className="form-col">
              <label>URL de la Organización / Fuente</label>
              <input type="url" name="source_url" placeholder="https://ejemplo.org" value={formData.source_url} onChange={handleChange} className="form-control" />
            </div>
          </div>

          <div className="form-group">
            <label>Resumen Corto (Máx 500 caract.) *</label>
            <textarea name="summary" required maxLength="500" value={formData.summary} onChange={handleChange} className="form-control textarea-short" />
          </div>

          <div className="form-group-large">
            <label>Descripción Completa *</label>
            <textarea name="description" required value={formData.description} onChange={handleChange} className="form-control textarea-long" />
          </div>

          <div className="text-right">
            <button type="submit" className="btn-primary">
              Continuar a Archivos →
            </button>
          </div>
        </div>

        {/* PASO 2: ARCHIVOS */}
        <div className={step === 2 ? "d-block" : "d-none"}>
          
          <div className="file-drop-area">
            <input type="file" multiple onChange={handleFileChange} id="file-upload" className="d-none" />
            <label htmlFor="file-upload" className="file-upload-label">
              📁 Haz clic aquí para seleccionar NUEVOS archivos (Opcional)
            </label>
            <p style={{textAlign: "center", fontSize: "12px", color: "#666", marginTop: "5px"}}>
              Si no seleccionas nada, se mantendrán los archivos actuales.
            </p>
          </div>

          {selectedFiles.length > 0 && (
            <div className="file-list-container">
              <h3>Archivos a subir:</h3>
              <ul className="file-list">
                {selectedFiles.map((f, i) => (
                  <li key={i} className="file-item">
                    <span>📄 {f.name} ({(f.size / 1024 / 1024).toFixed(2)} MB)</span>
                    <button type="button" onClick={() => removeFile(i)} className="btn-remove-file">✖</button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="form-actions">
            <button type="button" onClick={() => setStep(1)} className="btn-secondary">← Atrás</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}

export default EditarDataset;