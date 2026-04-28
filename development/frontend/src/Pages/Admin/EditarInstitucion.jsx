import { useState, useEffect, useRef } from "react";
import { 
  ArrowLeft, 
  Save, 
  X, 
  Building2, 
  Globe, 
  FileText, 
  ShieldCheck, 
  Image as ImageIcon,
  CheckCircle,
  AlertCircle
} from "lucide-react";
// IMPORTAMOS EL NUEVO CSS DEDICADO
import "../../Styles/Pages_styles/Admin/EditarInstitucion.css"; 
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

  const [imageFile, setImageFile] = useState(null);
  const [imageUrlPreview, setImageUrlPreview] = useState("");

  useEffect(() => {
    if (institucion) {
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
      setImageUrlPreview(institucion.logo_url || "");
    }
  }, [institucion]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrlPreview(reader.result); 
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // ... (Tu lógica de funcionalidad se mantiene intacta)
    try {
      let fileDataPayload = null;
      if (imageFile) {
        const presignedRes = await fetch(`${API_URL}/api/upload/presigned-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${user.token}` },
          body: JSON.stringify({ fileName: imageFile.name, contentType: imageFile.type })
        });
        if (!presignedRes.ok) throw new Error("Error obteniendo autorización.");
        const { uploadUrl, fileUrl, storageKey } = await presignedRes.json();
        const uploadRes = await fetch(uploadUrl, { method: "PUT", body: imageFile, headers: { "Content-Type": imageFile.type } });
        if (!uploadRes.ok) throw new Error("Error subiendo la imagen.");
        fileDataPayload = { storage_key: storageKey, file_url: fileUrl, mime_type: imageFile.type, file_size_bytes: imageFile.size };
      }
      const payload = {
        institution: { ...formData }
      };
      if (fileDataPayload) payload.file = fileDataPayload;
      const id = institucion.institution_id || institucion.id;
      const res = await fetch(`${API_URL}/api/instituciones/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${user.token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert("Institución actualizada correctamente");
        onCancel();
      }
    } catch (error) {
      console.error(error);
      alert("Error al procesar la solicitud.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="form-page-container">
      
      <div className="form-header">
        <button type="button" onClick={onCancel} className="btn-back">
          <ArrowLeft size={18} /> Volver
        </button>
        <div className="form-header-info">
          <h1>Editar Institución</h1>
          <p>Actualiza la información de la entidad en el sistema.</p>
        </div>
      </div>

      <div className="status-banner">
        <div className="status-banner-content">
          <AlertCircle size={20} />
          <span>Estas modificando: <strong>{formData.legal_name || "Cargando..."}</strong></span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="main-form">
        <div className="form-card">
          
          {/* Nombre oficial */}
          <div className="form-group input-wrapper">
            <label><Building2 size={14} /> Nombre oficial *</label>
            <input 
              type="text" 
              value={formData.legal_name} 
              onChange={e => setFormData({...formData, legal_name: e.target.value})} 
              required 
              className="form-control" 
            />
          </div>

          {/* Sigla y Tipo */}
          <div className="form-row">
            <div className="form-col input-wrapper">
              <label><FileText size={14} /> Sigla / Acrónimo</label>
              <input 
                type="text" 
                value={formData.short_name} 
                onChange={e => setFormData({...formData, short_name: e.target.value.toUpperCase()})} 
                className="form-control" 
              />
            </div>
            <div className="form-col input-wrapper">
              <label><ShieldCheck size={14} /> Tipo de Institución *</label>
              <select 
                value={formData.institution_type} 
                onChange={e => setFormData({...formData, institution_type: e.target.value})} 
                required 
                className="form-control"
              >
                <option value="" disabled>Seleccione el tipo</option>
                <option value="Academica">Académica</option>
                <option value="Institución pública">Institución pública</option>
                <option value="Privada">Privada</option>
                <option value="ONG">ONG</option>
              </select>
            </div>
          </div>

          {/* País y Rol */}
          <div className="form-row">
            <div className="form-col input-wrapper">
              <label><Globe size={14} /> País *</label>
              <input 
                type="text" 
                value={formData.country_name} 
                onChange={e => setFormData({...formData, country_name: e.target.value})} 
                required 
                className="form-control" 
              />
            </div>
            <div className="form-col input-wrapper">
              <label><CheckCircle size={14} /> Rol respecto a los datos *</label>
              <select 
                value={formData.data_role} 
                onChange={e => setFormData({...formData, data_role: e.target.value})} 
                required 
                className="form-control"
              >
                <option value="" disabled>Seleccione el rol</option>
                <option value="Generador">Generador</option>
                <option value="Distribuidor">Distribuidor</option>
                <option value="Administrador">Administrador</option>
              </select>
            </div>
          </div>

          {/* Logo Section */}
          <div className="logo-upload-container">
            <div className="logo-preview-area">
              {imageUrlPreview ? (
                <img src={imageUrlPreview} alt="Logo" className="logo-img-full" />
              ) : (
                <ImageIcon size={40} color="#cbd5e1" />
              )}
            </div>
            <div className="logo-inputs-area">
              <span className="logo-area-title">Logo Institucional</span>
              <p>Formatos permitidos: JPG, PNG. Máx 2MB.</p>
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                onChange={handleImageChange}
                className="file-input-custom" 
              />
            </div>
          </div>

          {/* Descripción */}
          <div className="form-group input-wrapper">
            <label><FileText size={14} /> Descripción Institucional *</label>
            <textarea 
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})} 
              required 
              rows="4" 
              className="form-control textarea-long" 
            />
          </div>

          {/* Radios Section */}
          <div className="radio-group-grid">
            <div className="radio-card">
              <span className="radio-card-title">Nivel de acceso</span>
              <div className="radio-flex">
                <label className="radio-custom-label">
                  <input type="radio" name="access_level" value="public" checked={formData.access_level === "public"} onChange={e => setFormData({...formData, access_level: e.target.value})} />
                  <span className="radio-text">Público</span>
                </label>
                <label className="radio-custom-label">
                  <input type="radio" name="access_level" value="internal" checked={formData.access_level === "internal"} onChange={e => setFormData({...formData, access_level: e.target.value})} />
                  <span className="radio-text">Privado</span>
                </label>
              </div>
            </div>

            <div className="radio-card">
              <span className="radio-card-title">Estado de la cuenta</span>
              <div className="radio-flex">
                <label className="radio-custom-label">
                  <input type="radio" name="institution_status" value="active" checked={formData.institution_status === "active"} onChange={e => setFormData({...formData, institution_status: e.target.value})} />
                  <span className="status-dot active"></span>
                  <span className="radio-text">Activo</span>
                </label>
                <label className="radio-custom-label">
                  <input type="radio" name="institution_status" value="inactive" checked={formData.institution_status === "inactive"} onChange={e => setFormData({...formData, institution_status: e.target.value})} />
                  <span className="status-dot inactive"></span>
                  <span className="radio-text">Inactivo</span>
                </label>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="form-actions">
            <button type="button" onClick={onCancel} className="btn-cancel">
              <X size={18} /> Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-save">
              {isSubmitting ? 'Guardando...' : <><Save size={18} /> Guardar Cambios</>}
            </button>
          </div>

        </div>
      </form>
    </div>
  );
}

export default EditarInstitucion;