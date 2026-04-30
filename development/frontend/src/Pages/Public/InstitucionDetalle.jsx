import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { MapPin, Globe, Database, Search, ArrowLeft } from "lucide-react";

import Breadcrumb from "../../Components/Common/Breadcrumb";
import AccordionFilter from "../../Components/Common/AccordionFilter";
import "../../Styles/Pages_styles/Public/InstitucionDetalle.css";

function InstitucionDetalle() {
  const { id } = useParams();

  const [institucion, setInstitucion] = useState(null);
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchDataset, setSearchDataset] = useState("");

  // TU LÓGICA DE FETCH INTACTA
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

        // 1. Fetch a la institución
        const resInst = await fetch(`${API_URL}/api/public/instituciones/${id}`);
        if (!resInst.ok) {
          const errorText = await resInst.text();
          throw new Error(`Backend devolvió error ${resInst.status} en Institución: ${errorText}`);
        }
        const dataInst = await resInst.json();

        // 2. Fetch a los datasets
        const resData = await fetch(`${API_URL}/api/public/instituciones/${id}/datasets?page=1`);
        let arreglodatasets = []; // Preparamos un arreglo vacío por defecto
        
        if (!resData.ok) {
          const errorText = await resData.text();
          // Solo advertimos, pero no rompemos la página si no hay datasets
          console.warn(`Backend devolvió error ${resData.status} en Datasets: ${errorText}`);
        } else {
          const dataSetsJson = await resData.json();
          // 👇 AQUÍ ESTÁ LA CLAVE: Extraemos el arreglo que viene dentro de "data"
          // Si por alguna razón no viene "data", dejamos el arreglo vacío para evitar errores
          arreglodatasets = dataSetsJson.data || []; 
        }

        setInstitucion(dataInst);
        setDatasets(arreglodatasets); // Ahora sí estamos guardando un Array real
      } catch (error) {
        console.error("Error cargando detalles:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) return <div className="loading-state">Cargando detalles de la institución...</div>;
  if (!institucion) return <div className="empty-state">No se encontró la institución solicitada.</div>;

  // Filtrado rápido para el buscador de la derecha
  const datasetsFiltrados = datasets.filter(ds => 
    (ds.nombre || ds.title || "").toLowerCase().includes(searchDataset.toLowerCase())
  );

  return (
    <main className="institucion-detalle-page">
      
      {/* NAVEGACIÓN SUPERIOR */}
      <Breadcrumb paths={["Inicio", "Instituciones", institucion.nombre || institucion.legal_name || "Detalle"]} />
      
      <div className="volver-container">
        <Link to="/instituciones" className="btn-volver">
          <ArrowLeft size={16} /> Volver a Instituciones
        </Link>
      </div>

      <div className="institucion-layout">

        {/* 🟪 IZQUIERDA: SIDEBAR (Info + Filtros) */}
        <aside className="left-column">

          {/* 🔹 CONTENEDOR 1: INFO */}
          <div className="sidebar-card info-card">
            <div className="sidebar-header">
              {/* Usa institucion.logo o institucion.logo_url según tu BD */}
              <img 
                src={institucion.logo || institucion.logo_url || "https://via.placeholder.com/150"} 
                alt={`Logo ${institucion.nombre}`} 
                className="inst-logo-large" 
              />
              <span className="badge-role">{institucion.data_role || "Publicador"}</span>
            </div>
            
            <h1 className="inst-title">{institucion.nombre || institucion.legal_name}</h1>
            <p className="inst-type">{institucion.institution_type || "Institución Pública"}</p>

            <div className="inst-meta">
              <div className="meta-item">
                <MapPin size={18} />
                <span>{institucion.country_name || "Chile"}</span>
              </div>
              {institucion.website && (
                <div className="meta-item">
                  <Globe size={18} />
                  <a href={institucion.website} target="_blank" rel="noreferrer">Sitio Web Oficial</a>
                </div>
              )}
            </div>

            <hr className="sidebar-divider" />

            <div className="inst-description">
              <h3>Acerca de la institución</h3>
              <p>{institucion.descripcion || institucion.description}</p>
            </div>
          </div>

          {/* 🔹 CONTENEDOR 2: FILTROS */}
          <div className="sidebar-card filter-card">
            <h3 className="filter-title">Filtros de Datasets</h3>
            <AccordionFilter />
          </div>

        </aside>

        {/* 🟦 DERECHA: DASHBOARD DE DATASETS */}
        <main className="right-column">
          
          <div className="dashboard-card">
            <div className="content-header">
              <div className="header-title">
                <Database className="icon-blue" size={24} />
                <h2>Datasets Publicados ({datasets.length})</h2>
              </div>
              
              <div className="dataset-search">
                <Search size={18} className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Buscar dataset..." 
                  value={searchDataset}
                  onChange={(e) => setSearchDataset(e.target.value)}
                />
              </div>
            </div>

            <div className="datasets-list">
              {datasetsFiltrados.length === 0 ? (
                <p className="empty-state-text">No se encontraron datasets con esos criterios.</p>
              ) : (
                datasetsFiltrados.map((ds) => (
                  <div key={ds.id || ds.dataset_id} className="dataset-item-card">
                    <div className="dataset-item-header">
                      <h3>{ds.nombre || ds.title}</h3>
                      <span className="badge-category">{ds.category || "General"}</span>
                    </div>
                    <p className="dataset-item-desc">{ds.descripcion || ds.description}</p>
                    <Link to={`/conjuntodatos/${ds.id || ds.dataset_id}`} className="btn-ver-dataset">
                      Ver Dataset completo
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

        </main>

      </div>
    </main>
  );
}

export default InstitucionDetalle;