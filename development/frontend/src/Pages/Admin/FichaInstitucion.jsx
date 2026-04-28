import React from 'react';
import { 
  X, 
  ArrowLeft, 
  Building2, 
  Globe, 
  FileText, 
  ShieldCheck, 
  CheckCircle,
  Info
} from "lucide-react";
// Importación del CSS dedicado
import "../../Styles/Pages_styles/Admin/FichaInstitucion.css"; 

function FichaInstitucion({ institucion, onBack }) {
  if (!institucion) return null;

  return (
    <div className="fi-page-container">
      
      {/* HEADER: Siguiendo el patrón de EditarInstitucion */}
      <div className="fi-header">
        <button type="button" onClick={onBack} className="fi-btn-back">
          <ArrowLeft size={18} /> Volver
        </button>
        <div className="fi-header-info">
          <h1>Ficha Institucional</h1>
          <p>Detalles completos de la entidad registrada en el sistema.</p>
        </div>
      </div>

      {/* BANNER DE ESTADO: Mismo estilo que el componente de edición */}
      <div className="fi-status-banner">
        <div className="fi-status-banner-content">
          <Info size={20} />
          <span>Visualizando información de: <strong>{institucion.legal_name}</strong></span>
        </div>
      </div>

      <div className="fi-main-card">
        
        {/* SECCIÓN DE LOGO Y TÍTULO PRINCIPAL */}
        <div className="fi-identity-section">
          <div className="fi-logo-preview">
            <img 
              src={institucion.logo_url || "/placeholder-logo.png"} 
              alt="Logo Institucional" 
              className="fi-logo-img"
              onError={(e) => { e.target.src = "https://via.placeholder.com/120?text=Sin+Logo"; }}
            />
          </div>
          <div className="fi-identity-text">
            <span className="fi-id-label">Nombre Legal</span>
            <h2>{institucion.legal_name}</h2>
            <div className="fi-badges-row">
              <span className={`fi-status-badge ${institucion.institution_status}`}>
                <span className={`fi-dot ${institucion.institution_status}`}></span>
                {institucion.institution_status === 'active' ? 'Activo' : 'Inactivo'}
              </span>
              <span className="fi-access-badge">
                Acceso {institucion.access_level === 'public' ? 'Público' : 'Privado'}
              </span>
            </div>
          </div>
        </div>

        {/* GRID DE INFORMACIÓN TÉCNICA (Estilo Proyecto 115) */}
        <div className="fi-details-grid">
          
          <div className="fi-info-wrapper">
            <label><FileText size={14} /> Sigla / Acrónimo</label>
            <div className="fi-data-display">{institucion.short_name || "No registra"}</div>
          </div>

          <div className="fi-info-wrapper">
            <label><ShieldCheck size={14} /> Tipo de Institución</label>
            <div className="fi-data-display">{institucion.institution_type}</div>
          </div>

          <div className="fi-info-wrapper">
            <label><Globe size={14} /> País</label>
            <div className="fi-data-display">{institucion.country_name}</div>
          </div>

          <div className="fi-info-wrapper">
            <label><CheckCircle size={14} /> Rol de Datos</label>
            <div className="fi-data-display">{institucion.data_role || "Sin asignar"}</div>
          </div>

        </div>

        {/* ÁREA DE DESCRIPCIÓN (Largo Completo) */}
        <div className="fi-info-wrapper fi-description-full">
          <label><FileText size={14} /> Descripción Institucional</label>
          <div className="fi-data-display fi-textarea-view">
            {institucion.description || "Esta institución no cuenta con una descripción detallada."}
          </div>
        </div>

        {/* ACCIONES FINALES */}
        <div className="fi-form-actions">
          <button type="button" onClick={onBack} className="fi-btn-exit">
            <X size={18} /> Cerrar Ficha
          </button>
        </div>

      </div>
    </div>
  );
}

export default FichaInstitucion;