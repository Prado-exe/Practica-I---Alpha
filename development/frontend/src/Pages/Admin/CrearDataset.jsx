import { useState, useEffect } from "react";
import "../../Styles/Pages_styles/Admin/GestionDatasets.css"; 
import { useAuth } from "../../Context/AuthContext";

// Usamos la misma constante de API de tu archivo de instituciones
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function CrearDataset({ onCancel }) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 👇 LA CLAVE DEL ÉXITO: Extraer el objeto 'user'
  const { user } = useAuth(); 

  const [categories, setCategories] = useState([]);
  const [licenses, setLicenses] = useState([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    summary: "",
    category_id: "",
    license_id: "",
    institution_id: "", 
    access_level: "public"
  });

  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setCategories([{ id: 1, name: "Demografía" }, { id: 2, name: "Economía" }]);
        setLicenses([{ id: 1, name: "Creative Commons BY 4.0" }]);
      } catch (error) {
        console.error("Error cargando opciones", error);
      }
    };
    fetchOptions();
  }, []);

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
    if (selectedFiles.length === 0) {
      alert("Debes subir al menos un archivo.");
      return;
    }

    setIsSubmitting(true);

    try {
      const uploadedFilesData = [];

      // PASO A: Subir cada archivo a MinIO (Idéntico a Instituciones)
      for (const file of selectedFiles) {
        
        // 1. Pedir URL Prefirmada
        const presignedRes = await fetch(`${API_URL}/api/upload/presigned-url`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json", 
            "Authorization": `Bearer ${user.token}` // 👈 Usando user.token
          },
          body: JSON.stringify({ fileName: file.name, contentType: file.type })
        });
        
        if (!presignedRes.ok) throw new Error("Error obteniendo URL de subida");
        const { uploadUrl, fileUrl, storageKey } = await presignedRes.json();

        // 2. Subir físicamente a MinIO
        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file
        });
        
        if (!uploadRes.ok) throw new Error(`Error subiendo el archivo ${file.name} a MinIO`);

        // 3. Guardar datos del archivo
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

      // PASO B: Guardar todo en PostgreSQL
      const payload = {
        ...formData,
        category_id: Number(formData.category_id),
        license_id: Number(formData.license_id),
        institution_id: formData.institution_id ? Number(formData.institution_id) : null,
        files: uploadedFilesData
      };

      const res = await fetch(`${API_URL}/api/datasets`, { 
        method: "POST", 
        headers: { 
          "Content-Type": "application/json", 
          "Authorization": `Bearer ${user.token}` // 👈 Usando user.token
        },
        body: JSON.stringify(payload) 
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Error del servidor al guardar el dataset");
      }
      
      alert("¡Dataset creado con éxito!");
      onCancel(); 

    } catch (error) {
      console.error(error);
      alert(error.message || "Ocurrió un error al procesar la solicitud.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="gestion-datasets" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      
      <div className="header" style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
        <button type="button" onClick={onCancel} style={{ cursor: 'pointer', padding: '5px 10px' }}>← Volver</button>
        <div>
          <h1>Crear Nuevo Dataset</h1>
          <p>Paso {step} de 2: {step === 1 ? 'Metadatos descriptivos' : 'Subida de archivos'}</p>
        </div>
      </div>

      <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2); } : handleSubmit}>
        
        {/* PASO 1: METADATOS */}
        <div style={{ display: step === 1 ? 'block' : 'none' }}>
          <div style={{ marginBottom: '15px' }}>
            <label>Título del Dataset *</label>
            <input type="text" name="title" required value={formData.title} onChange={handleChange} style={{ width: '100%', padding: '8px' }} />
          </div>

          <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
            <div style={{ flex: 1 }}>
              <label>Categoría *</label>
              <select name="category_id" required value={formData.category_id} onChange={handleChange} style={{ width: '100%', padding: '8px' }}>
                <option value="">Seleccione...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            
            <div style={{ flex: 1 }}>
              <label>Licencia *</label>
              <select name="license_id" required value={formData.license_id} onChange={handleChange} style={{ width: '100%', padding: '8px' }}>
                <option value="">Seleccione...</option>
                {licenses.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
            <div style={{ flex: 1 }}>
              <label>Institución Responsable</label>
              <select name="institution_id" disabled value={formData.institution_id} onChange={handleChange} style={{ width: '100%', padding: '8px', backgroundColor: '#f0f0f0' }}>
                <option value="">No disponible por el momento</option>
              </select>
              <small style={{ color: '#666' }}>Se habilitará en futuras versiones.</small>
            </div>

            <div style={{ flex: 1 }}>
              <label>Nivel de Acceso</label>
              <select name="access_level" value={formData.access_level} onChange={handleChange} style={{ width: '100%', padding: '8px' }}>
                <option value="public">Público (Cualquiera puede verlo)</option>
                <option value="internal">Interno (Solo usuarios registrados)</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Resumen Corto (Máx 500 caract.)</label>
            <textarea name="summary" maxLength="500" value={formData.summary} onChange={handleChange} style={{ width: '100%', padding: '8px', height: '60px' }} />
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label>Descripción Completa *</label>
            <textarea name="description" required value={formData.description} onChange={handleChange} style={{ width: '100%', padding: '8px', height: '120px' }} />
          </div>

          <div style={{ textAlign: 'right' }}>
            <button type="submit" className="btn-primary" style={{ padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none' }}>
              Continuar a Archivos →
            </button>
          </div>
        </div>

        {/* PASO 2: ARCHIVOS */}
        <div style={{ display: step === 2 ? 'block' : 'none' }}>
          
          <div style={{ border: '2px dashed #ccc', padding: '40px', textAlign: 'center', marginBottom: '20px', borderRadius: '8px' }}>
            <input 
              type="file" 
              multiple 
              onChange={handleFileChange} 
              id="file-upload" 
              style={{ display: 'none' }}
              accept=".csv,.doc,.docx,.dta,.html,.ipynb,.jpeg,.jpg,.json,.kml,.kmz,.ods,.parquet,.pdf,.pbix,.rar,.rdata,.sav,.shp,.txt,.url,.wms,.xls,.xlsx,.xml,.zip,.png"
            />
            <label htmlFor="file-upload" style={{ cursor: 'pointer', color: '#2196F3', fontWeight: 'bold', fontSize: '1.2rem' }}>
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
            <button type="button" onClick={() => setStep(1)} style={{ padding: '10px 20px', cursor: 'pointer' }}>
              ← Atrás
            </button>
            <button type="submit" disabled={isSubmitting || selectedFiles.length === 0} style={{ padding: '10px 20px', backgroundColor: isSubmitting ? '#ccc' : '#4CAF50', color: 'white', border: 'none', fontWeight: 'bold' }}>
              {isSubmitting ? 'Subiendo...' : 'Publicar Dataset'}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}

export default CrearDataset;