import { useState, useEffect, useRef } from "react";
// IMPORTAMOS EL NUEVO CSS DEDICADO
import "../../Styles/Pages_styles/Admin/CrearInstitucion.css"; 
import { useAuth } from "../../Context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function EditarInstitucion({ institucion, onCancel }) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    legal_name: "",
    short_name: "",
    institution_type: "",
    country_name: "",
    description: "",
    data_role: "",
    access_level: "public",
    institution_status: "active",
  });

  const [imageFile, setImageFile] = useState(null); // Para el archivo File crudo
  const [imageUrlPreview, setImageUrlPreview] = useState(""); // Para la URL de previsualización

  // Precargar datos de la prop 'institucion' (el truco del frontend)
  useEffect(() => {
    if (institucion) {
      console.log("Precargando institución para editar:", institucion);
      setFormData({
        legal_name: institucion.legal_name || "",
        short_name: institucion.short_name || "",
        institution_type: institucion.institution_type || "",
        country_name: institucion.country_name || "",
        description: institucion.description || "",
        data_role: institucion.data_role || "",
        access_level: institucion.access_level || "public",
        institution_status: institucion.institution_status || "active",
      });
      // Mostramos el logo actual que viene de la BD
      setImageUrlPreview(institucion.logo_url || "");
    }
  }, [institucion]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file); // Guardamos el archivo para subirlo luego
      const reader = new FileReader();
      reader.onloadend = () => {
        // Actualizamos la previsualización con la nueva imagen local
        setImageUrlPreview(reader.result); 
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let fileDataPayload = null;

      // Subimos imagen SOLO si el usuario seleccionó una NUEVA
      if (imageFile) {
        const presignedRes = await fetch(`${API_URL}/api/upload/presigned-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${user.token}` },
          body: JSON.stringify({ fileName: imageFile.name, contentType: imageFile.type })
        });

        if (!presignedRes.ok) throw new Error("Error obteniendo autorización para subir archivo.");
        const { uploadUrl, fileUrl, storageKey } = await presignedRes.json();

        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          body: imageFile,
          headers: { "Content-Type": imageFile.type }
        });

        if (!uploadRes.ok) throw new Error("Error subiendo la imagen al servidor.");
        
        // Datos del nuevo archivo para PostgreSQL
        fileDataPayload = {
          storage_key: storageKey,
          file_url: fileUrl,
          mime_type: imageFile.type,
          file_size_bytes: imageFile.size
        };
      }

      // Payload para la base de datos
      const payload = {
        institution: {
          legal_name: formData.legal_name,
          short_name: formData.short_name,
          institution_type: formData.institution_type,
          country_name: formData.country_name,
          description: formData.description,
          data_role: formData.data_role,
          access_level: formData.access_level,
          institution_status: formData.institution_status
        }
      };

      // Adjuntamos datos del archivo solo si se subió uno nuevo
      if (fileDataPayload) {
        payload.file = fileDataPayload;
      }

      // Hacemos PUT al ID específico
      const id = institucion.institution_id || institucion.id;
      const res = await fetch(`${API_URL}/api/instituciones/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${user.token}` },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert("Institución actualizada correctamente");
        onCancel(); // Volver a la tabla
      } else {
        const err = await res.json();
        alert(`Error del servidor: ${err.message}`);
      }

    } catch (error) {
      console.error("Error en guardado:", error);
      alert("Ocurrió un error al procesar la solicitud.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="form-page-container">
      
      {/* HEADER CON BOTÓN VOLVER */}
      <div className="form-header">
        <button type="button" onClick={onCancel} className="btn-back">← Volver</button>
        <div className="form-header-info">
          <h1>Editar Institución</h1>
          <p>Actualiza la información de la entidad.</p>
        </div>
      </div>

      {/* ALERTA DE ESTADO (EDITANDO...) */}
      <div className="status-alert">
        <strong>Editando:</strong> <span className="status-text">{formData.legal_name || "Institución"}</span>
      </div>

      <form onSubmit={handleSubmit} className="main-form">
        
        {/* FILA 1: Nombre oficial */}
        <div className="form-group input-wrapper">
          <label>Nombre oficial *</label>
          <input type="text" value={formData.legal_name} onChange={e => setFormData({...formData, legal_name: e.target.value})} required className="form-control" />
        </div>

        {/* FILA 2: Sigla y Tipo */}
        <div className="form-row">
          <div className="form-col input-wrapper">
            <label>Sigla / Acrónimo</label>
            <input type="text" value={formData.short_name} onChange={e => setFormData({...formData, short_name: e.target.value.toUpperCase()})} className="form-control" />
          </div>
          <div className="form-col input-wrapper">
            <label>Tipo de Institución *</label>
            <select value={formData.institution_type} onChange={e => setFormData({...formData, institution_type: e.target.value})} required className="form-control">
              <option value="" disabled>Seleccione el tipo</option>
              <option value="Academica">Académica</option>
              <option value="Institución pública">Institución pública</option>
              <option value="Privada">Privada</option>
              <option value="ONG">ONG</option>
            </select>
          </div>
        </div>

        {/* FILA 3: País y Rol */}
        <div className="form-row">
          <div className="form-col input-wrapper">
            <label>País *</label>
            <input type="text" value={formData.country_name} onChange={e => setFormData({...formData, country_name: e.target.value})} required placeholder="Ej: Chile" className="form-control" />
          </div>
          <div className="form-col input-wrapper">
            <label>Rol respecto a los datos *</label>
            <select value={formData.data_role} onChange={e => setFormData({...formData, data_role: e.target.value})} required className="form-control">
              <option value="" disabled>Seleccione el rol</option>
              <option value="Generador">Generador</option>
              <option value="Distribuidor">Distribuidor</option>
              <option value="Administrador">Administrador</option>
            </select>
          </div>
        </div>

        {/* FILA 4: SECCIÓN DE LOGO INSTITUCIONAL (CENTRADO Y OPCIONAL) */}
        <div className="logo-section">
          <label className="logo-section-title">Logo Institucional (Opcional)</label>
          <div className="logo-content">
            <div className="logo-preview-box">
              {imageUrlPreview ? (
                <img src={imageUrlPreview} alt="Previsualización Logo" className="logo-img-preview" />
              ) : (
                <div className="logo-placeholder">Sin imagen</div>
              )}
            </div>
            <div className="logo-upload-controls">
              {/* No es requerido en edición */}
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} />
              <small className="file-help-text">Sube una imagen solo si deseas cambiar la actual.</small>
            </div>
          </div>
        </div>

        {/* FILA 5: Descripción */}
        <div className="form-group input-wrapper">
          <label>Descripción Institucional *</label>
          <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required maxLength="1000" rows="4" className="form-control textarea-long" />
        </div>

        {/* FILA 6: Nivel de acceso y Estado (Radios) */}
        <div className="radio-group-section">
          <div className="radio-col">
            <label className="radio-label-title">Nivel de acceso</label>
            <div className="radio-options">
              <label className="radio-option-label">
                <input type="radio" name="access_level" value="public" checked={formData.access_level === "public"} onChange={e => setFormData({...formData, access_level: e.target.value})} /> Públic
              </label>
              <label className="radio-option-label">
                <input type="radio" name="access_level" value="internal" checked={formData.access_level === "internal"} onChange={e => setFormData({...formData, access_level: e.target.value})} /> Privado (Interno)
              </label>
            </div>
          </div>
          <div className="radio-col">
            <label className="radio-label-title">Estado</label>
            <div className="radio-options">
              <label className="radio-option-label">
                <input type="radio" name="institution_status" value="active" checked={formData.institution_status === "active"} onChange={e => setFormData({...formData, institution_status: e.target.value})} /> Activo
              </label>
              <label className="radio-option-label">
                <input type="radio" name="institution_status" value="inactive" checked={formData.institution_status === "inactive"} onChange={e => setFormData({...formData, institution_status: e.target.value})} /> Inactivo
              </label>
            </div>
          </div>
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>

      </form>
    </div>
  );
}

export default EditarInstitucion;