import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line
} from "recharts";
import {
  Database, Globe, Layers, ArrowRight, Loader2,
  BookOpen, HeartPulse, Landmark, TreePine, TrendingUp, Briefcase, Activity,
  Building2, Calendar
} from "lucide-react";

import Breadcrumb from "../../Components/Common/Breadcrumb";
import { getDatasets } from "../../Services/DatasetService"; 
import "../../Styles/Pages_styles/Public/IndicadoresDefault.css";

const GLOBAL_COLORS = ["#0056b3","#1976d2","#1b7a4a","#388e3c","#ef6c00","#c62828","#6a1b9a","#00838f"];

// Función auxiliar para iconos temáticos
const getCategoryIcon = (categoryName) => {
  const name = categoryName.toLowerCase();
  if (name.includes("educaci")) return BookOpen;
  if (name.includes("salud")) return HeartPulse;
  if (name.includes("econom") || name.includes("finanz")) return TrendingUp;
  if (name.includes("ambient") || name.includes("natur")) return TreePine;
  if (name.includes("gobierno") || name.includes("politic")) return Landmark;
  if (name.includes("trabajo") || name.includes("empleo")) return Briefcase;
  return Layers;
};

// SIMULADOR DE TENDENCIAS
const generateDummyTrend = () => [
  { year: '2020', value: Math.floor(Math.random() * 20) + 5 },
  { year: '2021', value: Math.floor(Math.random() * 30) + 10 },
  { year: '2022', value: Math.floor(Math.random() * 40) + 15 },
  { year: '2023', value: Math.floor(Math.random() * 50) + 20 },
  { year: '2024', value: Math.floor(Math.random() * 60) + 25 },
];

// Componente CircularProgress
function CircularProgress({ percentage, color, size = 46 }) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="circular-progress-wrap" style={{ width: size, height: size }}>
      <svg height={size} width={size} className="circular-progress">
        <circle stroke="#f0f0f0" fill="transparent" strokeWidth={strokeWidth} r={radius} cx={size/2} cy={size/2} />
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s ease-out' }}
          r={radius} cx={size/2} cy={size/2}
          transform={`rotate(-90 ${size/2} ${size/2})`}
        />
      </svg>
      <span className="circular-percentage-text" style={{ color }}>
        {Math.round(percentage)}%
      </span>
    </div>
  );
}

function IndicadoresDefault() {
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // NUEVO: Estado para controlar la pestaña activa
  const [activeTab, setActiveTab] = useState("tematico");

  useEffect(() => {
    async function fetchDatasets() {
      try {
        const response = await getDatasets({ limit: 100 });
        setDatasets(response.data || []);
      } catch (err) {
        console.error("Error al cargar datasets:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDatasets();
  }, []);

  // 1. Estadísticas para la pestaña "Análisis Temático"
  const thematicStats = useMemo(() => {
    if (!datasets.length) return { total: 0, data: [] };
    const total = datasets.length;
    const categoryCount = {};
    
    datasets.forEach(ds => {
      const cat = ds.categoria || ds.category?.name || "Sin Categoría";
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    const data = Object.entries(categoryCount)
      .map(([name, count], index) => ({ 
        name, count, 
        percentage: (count / total) * 100,
        color: GLOBAL_COLORS[index % GLOBAL_COLORS.length],
        trend: generateDummyTrend() 
      }))
      .sort((a, b) => b.count - a.count);

    return { total, data };
  }, [datasets]);

  // 2. NUEVO: Estadísticas para la pestaña "Análisis por Origen" (Instituciones)
  const originStats = useMemo(() => {
    if (!datasets.length) return { total: 0, data: [] };
    const total = datasets.length;
    const instMap = {};

    datasets.forEach(ds => {
      // Ajusta esto según cómo venga la institución en tu API (ds.institucion.nombre o ds.institucion)
      const instName = ds.institucion?.nombre || ds.institucion || "Institución Desconocida";
      const catName = ds.categoria || ds.category?.name || "Sin Categoría";
      const dateStr = ds.updated_at || ds.created_at; // Ajusta según el campo de fecha de tu API

      if (!instMap[instName]) {
        instMap[instName] = { count: 0, categories: {}, latestDate: null };
      }

      instMap[instName].count += 1;
      instMap[instName].categories[catName] = (instMap[instName].categories[catName] || 0) + 1;

      if (dateStr) {
         const current = new Date(dateStr);
         if (!instMap[instName].latestDate || current > instMap[instName].latestDate) {
           instMap[instName].latestDate = current;
         }
      }
    });

    const data = Object.entries(instMap).map(([name, info], index) => {
       // Calcular la categoría principal (la que más se repite para esta institución)
       const topCat = Object.entries(info.categories).sort((a, b) => b[1] - a[1])[0][0];
       
       // Formatear la fecha
       const formattedDate = info.latestDate 
          ? info.latestDate.toLocaleDateString("es-CL", { year: 'numeric', month: 'short', day: 'numeric' })
          : "N/A";

       return {
          name,
          count: info.count,
          percentage: (info.count / total) * 100,
          topCategory: topCat,
          lastUpdated: formattedDate,
          color: GLOBAL_COLORS[index % GLOBAL_COLORS.length]
       };
    }).sort((a, b) => b.count - a.count);

    return { total, data };
  }, [datasets]);

  const handleDatasetClick = (datasetId) => {
    navigate(`/indicadores/analisis`, { state: { selectedDatasetId: datasetId } });
  };

  return (
    <main className="indicadores-default-page">
      <Breadcrumb paths={["Inicio", "Indicadores Globales"]} />

      <section className="ind-hero">
        <div className="ind-hero-text">
          <h1>Dashboard de Indicadores Globales</h1>
          <p>Visión general del estado de los datos en el Observatorio. Explora la distribución temática y selecciona un conjunto de datos para un análisis detallado.</p>
        </div>
        <div className="ind-hero-badge">
          <Activity size={44} strokeWidth={1.4} />
          <span>Estado Actual</span>
        </div>
      </section>

      {/* NUEVO: Controles de Pestañas */}
      <div className="ind-tabs-container">
        <div className="ind-tabs">
          <button 
            className={`tab-btn ${activeTab === 'tematico' ? 'active' : ''}`}
            onClick={() => setActiveTab('tematico')}
          >
            <Layers size={18} />
            Análisis Temático
          </button>
          <button 
            className={`tab-btn ${activeTab === 'origen' ? 'active' : ''}`}
            onClick={() => setActiveTab('origen')}
          >
            <Building2 size={18} />
            Análisis por Origen
          </button>
        </div>
      </div>

      <hr className="ind-separator" style={{ marginTop: 0 }} />

      {loading ? (
        <div className="ind-loading">
          <Loader2 size={40} className="spin" />
          <p>Cargando panorama global...</p>
        </div>
      ) : (
        <div className="ind-global-content fade-in">
          
          <div className="section-header">
            <h2 className="section-title">
              {activeTab === 'tematico' ? 'Estado Actual por Categorías' : 'Análisis de Fuentes y Origen de Datos'}
            </h2>
            <p className="section-subtitle">
              {activeTab === 'tematico' 
                ? `Distribución, tendencias de publicación y volumen por categoría temática. (Total: ${thematicStats.total} Datasets)` 
                : `Distribución de conjuntos de datos según las instituciones proveedoras. (Total: ${originStats.total} Datasets)`}
            </p>
          </div>

          <div className="status-table-container">
            <table className="status-table">
              <thead>
                <tr>
                  <th>{activeTab === 'tematico' ? 'Categoría' : 'Institución'}</th>
                  <th>Datasets</th>
                  <th>Porcentaje</th>
                  {activeTab === 'tematico' ? (
                    <th>Tendencia por Año</th>
                  ) : (
                    <>
                      <th>Categoría Principal</th>
                      <th>Última Actualización</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {activeTab === 'tematico' && thematicStats.data.map((cat, i) => {
                  const IconComponent = getCategoryIcon(cat.name);
                  return (
                    <tr key={i}>
                      <td className="col-categoria">
                        <div className="cat-icon-text">
                          <div className="status-icon" style={{ backgroundColor: `${cat.color}15`, color: cat.color }}>
                            <IconComponent size={20} />
                          </div>
                          <span className="cat-name">{cat.name}</span>
                        </div>
                      </td>
                      <td className="col-cantidad">{cat.count}</td>
                      <td className="col-porcentaje">
                        <CircularProgress percentage={cat.percentage} color={cat.color} />
                      </td>
                      <td className="col-tendencia">
                        <div className="sparkline-wrapper">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={cat.trend}>
                              <Line type="monotone" dataKey="value" stroke={cat.color} strokeWidth={2.5} dot={false} isAnimationActive={true}/>
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {/* NUEVO: Filas para Análisis por Origen */}
                {activeTab === 'origen' && originStats.data.map((inst, i) => (
                  <tr key={i}>
                    <td className="col-categoria">
                      <div className="cat-icon-text">
                        <div className="status-icon" style={{ backgroundColor: `${inst.color}15`, color: inst.color }}>
                          <Building2 size={20} />
                        </div>
                        <span className="cat-name">{inst.name}</span>
                      </div>
                    </td>
                    <td className="col-cantidad">{inst.count}</td>
                    <td className="col-porcentaje">
                      <CircularProgress percentage={inst.percentage} color={inst.color} />
                    </td>
                    <td className="col-top-cat">
                      <span className="meta-badge" style={{ color: inst.color, backgroundColor: `${inst.color}10`, border: `1px solid ${inst.color}30` }}>
                        {inst.topCategory}
                      </span>
                    </td>
                    <td className="col-fecha">
                      <div className="date-cell">
                        <Calendar size={14} />
                        <span>{inst.lastUpdated}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <hr className="ind-separator" />

          {/* Explorador de datasets */}
          <div className="chart-card ds-explorer">
            <div className="chart-header-row">
              <div>
                <h2 className="chart-title">Analizar Datos Específicos</h2>
                <p className="chart-subtitle">Selecciona un conjunto de datos del catálogo para extraer gráficos y mapeos internos.</p>
              </div>
            </div>
            
            <div className="dataset-grid-links">
              {datasets.map(ds => (
                <button 
                  key={ds.dataset_id} 
                  className="ds-link-card" 
                  onClick={() => handleDatasetClick(ds.dataset_id)}
                  style={{ "--ds-color": ds.color || '#0056b3' }}
                >
                  <div className="ds-link-content">
                    <span className="ds-cat">{ds.categoria || "Dataset"}</span>
                    <h3 className="ds-name">{ds.nombre}</h3>
                  </div>
                  <div className="ds-link-icon">
                    <ArrowRight size={20} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default IndicadoresDefault;