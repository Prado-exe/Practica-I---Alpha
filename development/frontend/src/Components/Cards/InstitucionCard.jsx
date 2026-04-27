import { Link } from "react-router-dom"; // 👈 Añadido para la navegación

function InstitucionCard({ institucion }) {
  // 🛡️ PROTECCIÓN: Si no hay descripción, usamos un texto por defecto en vez de explotar
  const descripcionSegura = institucion.description || "Sin descripción disponible.";

  return (
    <div className="institucion-card">
      
      <div className="card-header">
        <img 
          src={institucion.logo_url || "https://via.placeholder.com/50"} 
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
          {/* Si luego tienes el dato real, puedes cambiar el 0 por institucion.dataset_count */}
          <strong>0</strong> datasets
        </span>
        
        {/* 👇 Cambiado: Ahora es un Link que te lleva a la vista de detalles */}
        <Link 
          to={`/instituciones/${institucion.institution_id}`} 
          className="ver-btn"
          style={{ textDecoration: 'none', textAlign: 'center' }}
        >
          Ver institución
        </Link>
      </div>
      
    </div>
  );
}

export default InstitucionCard;