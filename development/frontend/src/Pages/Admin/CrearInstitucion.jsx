import { useState, useRef } from "react";
import "../../Styles/Pages_styles/Admin/CrearInstitucion.css"; 
import { useAuth } from "../../Context/AuthContext";
// NUEVOS ICONOS PARA CONSISTENCIA
import { ArrowLeft, Building2, Globe, ShieldCheck, FileText, Upload, Image as ImageIcon } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function CrearInstitucion({ onCancel }) {
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
    image: null,
    imageUrlPreview: "",
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: file, imageUrlPreview: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.image) {
      alert("La imagen de la institución es obligatoria.");
      return;
    }
    setIsSubmitting(true);
    try {
      let fileDataPayload = null;
      if (formData.image instanceof File) {
        const presignedRes = await fetch(`${API_URL}/api/upload/presigned-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${user.token}` },
          body: JSON.stringify({ fileName: formData.image.name, contentType: formData.image.type })
        });
        if (!presignedRes.ok) throw new Error("Error obteniendo autorización.");
        const { uploadUrl, fileUrl, storageKey } = await presignedRes.json();
        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          body: formData.image,
          headers: { "Content-Type": formData.image.type }
        });
        if (!uploadRes.ok) throw new Error("Error subiendo la imagen.");
        fileDataPayload = {
          storage_key: storageKey,
          file_url: fileUrl,
          mime_type: formData.image.type,
          file_size_bytes: formData.image.size
        };
      }
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
        },
        file: fileDataPayload
      };
      const res = await fetch(`${API_URL}/api/instituciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${user.token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert(`Institución creada correctamente`);
        onCancel();
      } else {
        const err = await res.json();
        alert(`Error: ${err.message}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Ocurrió un error al procesar la solicitud.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="form-page-container">
      {/* HEADER CONSISTENTE CON GESTIÓN DE DATASETS */}
      <div className="form-header">
        <button type="button" onClick={onCancel} className="btn-back">
          <ArrowLeft size={18} /> Volver
        </button>
        <div className="form-header-info">
          <h1>Crear Nueva Institución</h1>
          <p>Registro oficial de entidades generadoras y administradoras de datos.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="main-form">
        <div className="form-card">
          {/* FILA 1: Nombre oficial */}
          <div className="form-group input-wrapper">
            <label><Building2 size={14} /> Nombre oficial *</label>
            <input 
              type="text" 
              value={formData.legal_name} 
              onChange={e => setFormData({...formData, legal_name: e.target.value})} 
              required 
              placeholder="Nombre completo de la institución"
              className="form-control" 
            />
          </div>

          {/* FILA 2: Sigla y Tipo */}
          <div className="form-row">
            <div className="form-col input-wrapper">
              <label>Sigla / Acrónimo</label>
              <input 
                type="text" 
                value={formData.short_name} 
                onChange={e => setFormData({...formData, short_name: e.target.value.toUpperCase()})} 
                placeholder="Ej: MINECON"
                className="form-control" 
              />
            </div>
            <div className="form-col input-wrapper">
              <label>Tipo de Institución *</label>
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

          {/* FILA 3: País y Rol */}
          <div className="form-row">
            <div className="form-col input-wrapper">
              <label><Globe size={14} /> País *</label>
              <input 
                type="text" 
                value={formData.country_name} 
                onChange={e => setFormData({...formData, country_name: e.target.value})} 
                required 
                placeholder="Ej: Chile" 
                className="form-control" 
              />
            </div>
            <div className="form-col input-wrapper">
              <label><ShieldCheck size={14} /> Rol respecto a los datos *</label>
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

          {/* SECCIÓN DE LOGO */}
          <div className="logo-section">
            <label className="logo-section-title"><ImageIcon size={14} /> Logo Institucional *</label>
            <div className="logo-content">
              <div className="logo-preview-box">
                {formData.imageUrlPreview ? (
                  <img src={formData.imageUrlPreview} alt="Preview" className="logo-img-preview" />
                ) : (
                  <Upload size={30} color="#cbd5e1" />
                )}
              </div>
              <div className="logo-upload-controls">
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  onChange={handleImageChange} 
                  className="file-input-custom"
                />
                <small className="file-help-text">Formatos: JPG, PNG. Máx: 2MB.</small>
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div className="form-group input-wrapper">
            <label><FileText size={14} /> Descripción Institucional *</label>
            <textarea 
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})} 
              required 
              maxLength="1000" 
              rows="4" 
              placeholder="Resumen de las actividades y objetivos de la institución..."
              className="form-control textarea-long" 
            />
          </div>

          {/* Radios de Acceso y Estado */}
          <div className="radio-group-grid">
            <div className="radio-card">
              <span className="radio-title">Nivel de acceso</span>
              <div className="radio-options">
                <label className="radio-option">
                  <input type="radio" name="access_level" value="public" checked={formData.access_level === "public"} onChange={e => setFormData({...formData, access_level: e.target.value})} /> 
                  <span>Público</span>
                </label>
                <label className="radio-option">
                  <input type="radio" name="access_level" value="internal" checked={formData.access_level === "internal"} onChange={e => setFormData({...formData, access_level: e.target.value})} /> 
                  <span>Privado</span>
                </label>
              </div>
            </div>

            <div className="radio-card">
              <span className="radio-title">Estado Operativo</span>
              <div className="radio-options">
                <label className="radio-option">
                  <input type="radio" name="institution_status" value="active" checked={formData.institution_status === "active"} onChange={e => setFormData({...formData, institution_status: e.target.value})} /> 
                  <span className="status-pill active">Activo</span>
                </label>
                <label className="radio-option">
                  <input type="radio" name="institution_status" value="inactive" checked={formData.institution_status === "inactive"} onChange={e => setFormData({...formData, institution_status: e.target.value})} /> 
                  <span className="status-pill inactive">Inactivo</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn-cancel">Cancelar</button>
          <button type="submit" disabled={isSubmitting} className="btn-save">
            {isSubmitting ? 'Guardando...' : 'Registrar Institución'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CrearInstitucion;