import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../Styles/Pages_styles/Admin/GestionDatasets.css"; 
import { useAuth } from "../../Context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://3.139.202.192:3000";

function CrearDatasetUsuario() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
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
    creation_date: new Date().toISOString().split('T')[0],
    temporal_coverage_start: "",
    temporal_coverage_end: "",
    geographic_coverage: "",
    update_frequency: "",
    source_url: "",
    dataset_status: "pending_validation", // 👈 NUEVO: Estado por defecto
    message: "" 
  });

  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const catRes = await fetch(`${API_URL}/api/categories`);
        if (catRes.ok) setCategories((await catRes.json()).data || []); 

        const licRes = await fetch(`${API_URL}/api/licenses`);
        if (licRes.ok) setLicenses((await licRes.json()).data || []);

        const instRes = await fetch(`${API_URL}/api/public/instituciones`);
        if (instRes.ok) setInstituciones((await instRes.json()).instituciones || []);
      } catch (error) {
        console.error("Error cargando opciones:", error);
      }
    };
    fetchOptions();
  }, [user.token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => setSelectedFiles(Array.from(e.target.files));
  const removeFile = (indexToRemove) => setSelectedFiles(files => files.filter((_, index) => index !== indexToRemove));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return alert("Debes subir al menos un archivo.");
    if (formData.dataset_status === 'pending_validation' && (!formData.message || formData.message.trim().length < 10)) {
      return alert("Por favor, incluye un mensaje descriptivo para el revisor.");
    }

    setIsSubmitting(true);

    try {
      const uploadedFilesData = [];

      for (const file of selectedFiles) {
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
          file_size_bytes: file.size, file_role: 'source', is_primary: uploadedFilesData.length === 0 
        });
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
        files: uploadedFilesData,
        message: formData.dataset_status === 'draft' ? null : formData.message // Ignoramos el mensaje si es borrador
      };

      const res = await fetch(`${API_URL}/api/datasets/request`, { 
        method: "POST", 
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${user.token}` },
        body: JSON.stringify(payload) 
      });

      if (!res.ok) {
        const err = await res.json();
        let errorMsg = "Error del servidor al procesar la solicitud";
        if (Array.isArray(err.message)) errorMsg = err.message.map(e => e.message).join(", ");
        else if (err.message) errorMsg = err.message;
        throw new Error(errorMsg);
      }
      
      const successMsg = formData.dataset_status === 'draft' 
        ? "¡Borrador guardado exitosamente en tu área de trabajo!" 
        : "¡Tu propuesta de Dataset ha sido enviada a revisión con éxito!";
      
      alert(successMsg);
      navigate(-1);

    } catch (error) {
      console.error(error);
      alert(error.message || "Ocurrió un error al procesar la solicitud.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="gestion-datasets" style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      
      <div className="header" style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
        <button type="button" onClick={() => navigate(-1)} style={{ cursor: 'pointer', padding: '5px 10px' }}>← Volver</button>
        <div>
          <h1>Proponer Nuevo Dataset</h1>
          <p>Paso {step} de 2: {step === 1 ? 'Metadatos y Acción' : 'Subida de archivos'}</p>
        </div>
      </div>

      <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2); } : handleSubmit}>
        
        {/* PASO 1: METADATOS Y ACCIÓN */}
        <div style={{ display: step === 1 ? 'block' : 'none' }}>
          
          {/* 👇 SECCIÓN DE ACCIÓN (NUEVA) 👇 */}
          <div style={{ marginBottom: '25px', padding: '15px', background: formData.dataset_status === 'draft' ? '#e3f2fd' : '#fff3e0', border: '1px solid', borderColor: formData.dataset_status === 'draft' ? '#90caf9' : '#ffcc80', borderRadius: '5px' }}>
            <label style={{ fontWeight: 'bold', fontSize: '16px' }}>¿Qué deseas hacer con este dataset?</label>
            <select name="dataset_status" value={formData.dataset_status} onChange={handleChange} style={{ width: '100%', padding: '10px', marginTop: '10px', fontSize: '15px', fontWeight: 'bold' }}>
              <option value="pending_validation">📤 Enviar a Validación (Los administradores lo revisarán para publicarlo)</option>
              <option value="draft">💾 Guardar como Borrador (Privado, puedes seguir editándolo más tarde)</option>
            </select>
          </div>

          {/* 👇 MENSAJE CONDICIONAL 👇 */}
          {formData.dataset_status === 'pending_validation' && (
            <div style={{ marginBottom: '20px', padding: '15px', background: '#fafafa', border: '1px solid #ddd', borderRadius: '5px', borderLeft: '4px solid #d32f2f' }}>
              <label style={{ color: '#d32f2f', fontWeight: 'bold' }}>Mensaje para el Revisor (Obligatorio) *</label>
              <p style={{ margin: '5px 0', fontSize: '13px', color: '#555' }}>Explica brevemente por qué estás proponiendo este dataset y cuál es su utilidad.</p>
              <textarea name="message" required minLength="10" placeholder="Ej: Solicito la validación de estos datos estadísticos..." value={formData.message} onChange={handleChange} style={{ width: '100%', padding: '8px', height: '60px' }} />
            </div>
          )}

          <div style={{ marginBottom: '15px' }}>
            <label>Título del Dataset *</label>
            <input type="text" name="title" required value={formData.title} onChange={handleChange} style={{ width: '100%', padding: '8px' }} />
          </div>

          <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
            <div style={{ flex: 1 }}>
              <label>Fecha de Creación de los Datos *</label>
              <input type="date" name="creation_date" required value={formData.creation_date} onChange={handleChange} style={{ width: '100%', padding: '8px' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label>Frecuencia de Actualización</label>
              <select name="update_frequency" value={formData.update_frequency} onChange={handleChange} style={{ width: '100%', padding: '8px' }}>
                <option value="">No definida</option>
                <option value="Anual">Anual</option>
                <option value="Semestral">Semestral</option>
                <option value="Trimestral">Trimestral</option>
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

          <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
            <div style={{ flex: 1 }}>
              <label>Institución Responsable</label>
              <select name="institution_id" value={formData.institution_id} onChange={handleChange} style={{ width: '100%', padding: '8px' }}>
                <option value="">Seleccione...</option>
                {instituciones.map(inst => <option key={inst.institution_id} value={inst.institution_id}>{inst.legal_name}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label>Nivel de Acceso Solicitado</label>
              <select name="access_level" value={formData.access_level} onChange={handleChange} style={{ width: '100%', padding: '8px' }}>
                <option value="public">Público (Cualquiera)</option>
                <option value="internal">Interno (Registrados)</option>
              </select>
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

          <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
            <div style={{ flex: 1 }}>
              <label>Cobertura Geográfica</label>
              <input type="text" name="geographic_coverage" placeholder="Ej: Chile, Regional..." value={formData.geographic_coverage} onChange={handleChange} style={{ width: '100%', padding: '8px' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label>URL de la Organización / Fuente</label>
              <input type="url" name="source_url" placeholder="https://ejemplo.org" value={formData.source_url} onChange={handleChange} style={{ width: '100%', padding: '8px' }} />
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Resumen Corto (Máx 500 caract.) *</label>
            <textarea name="summary" required maxLength="500" value={formData.summary} onChange={handleChange} style={{ width: '100%', padding: '8px', height: '60px' }} />
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label>Descripción Completa *</label>
            <textarea name="description" required value={formData.description} onChange={handleChange} style={{ width: '100%', padding: '8px', height: '120px' }} />
          </div>

          <div style={{ textAlign: 'right' }}>
            <button type="submit" style={{ padding: '10px 20px', backgroundColor: formData.dataset_status === 'draft' ? '#2196F3' : '#ff9800', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
              Continuar a Archivos →
            </button>
          </div>
        </div>

        {/* PASO 2: ARCHIVOS */}
        <div style={{ display: step === 2 ? 'block' : 'none' }}>
          <div style={{ border: '2px dashed #ccc', padding: '40px', textAlign: 'center', marginBottom: '20px', borderRadius: '8px' }}>
            <input type="file" multiple onChange={handleFileChange} id="file-upload" style={{ display: 'none' }} />
            <label htmlFor="file-upload" style={{ cursor: 'pointer', color: formData.dataset_status === 'draft' ? '#2196F3' : '#ff9800', fontWeight: 'bold' }}>
              📁 Haz clic aquí para seleccionar archivos
            </label>
          </div>

          {selectedFiles.length > 0 && (
            <div style={{ marginBottom: '25px' }}>
              <h3>Archivos a subir:</h3>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {selectedFiles.map((f, i) => (
                  <li key={i} style={{ padding: '10px', backgroundColor: '#f9f9f9', marginBottom: '5px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>📄 {f.name} ({(f.size / 1024 / 1024).toFixed(2)} MB)</span>
                    <button type="button" onClick={() => removeFile(i)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>✖</button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
            <button type="button" onClick={() => setStep(1)} style={{ padding: '10px 20px', cursor: 'pointer' }}>← Atrás</button>
            <button type="submit" disabled={isSubmitting || selectedFiles.length === 0} style={{ padding: '10px 20px', backgroundColor: isSubmitting ? '#ccc' : (formData.dataset_status === 'draft' ? '#2196F3' : '#ff9800'), color: 'white', border: 'none', fontWeight: 'bold' }}>
              {isSubmitting ? 'Procesando...' : (formData.dataset_status === 'draft' ? '💾 Guardar Borrador' : '📤 Enviar a Revisión')}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}

export default CrearDatasetUsuario;