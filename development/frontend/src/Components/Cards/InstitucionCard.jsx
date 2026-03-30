function InstitucionCard({ institucion, onOpenModal }) {
  // 🛡️ PROTECCIÓN: Si no hay descripción, usamos un texto por defecto en vez de explotar
  const descripcionSegura = institucion.description || "Sin descripción disponible.";

  return (
    <div className="institucion-card">
      
      <div className="card-header">
        <img 
          src={institucion.logo_url} 
          alt={`Logo de ${institucion.short_name || institucion.legal_name}`} 
        />
        <h3>{institucion.legal_name}</h3>
      </div>
      
      <p className="descripcion">
        {descripcionSegura.length > 120 
          ? descripcionSegura.substring(0, 120) + "..." 
          : descripcionSegura}
      </p>
      
      <div className="card-footer">
        <span className="dataset-count">
          <strong>0</strong> datasets
        </span>
        <button 
          className="ver-btn" 
          onClick={() => onOpenModal(institucion)}
        >
          Ver institución
        </button>
      </div>
      
    </div>
  );
}

export default InstitucionCard;