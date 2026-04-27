import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid, AreaChart, Area
} from "recharts";
import {
  Database, Globe, Layers, ArrowRight, Loader2,
  BookOpen, HeartPulse, Landmark, TreePine, TrendingUp, Briefcase, Activity,
  Building2, Calendar, Filter, LineChart as LineChartIcon
} from "lucide-react";

import Breadcrumb from "../../Components/Common/Breadcrumb";
import { getDatasets } from "../../Services/DatasetService"; 
import "../../Styles/Pages_styles/Public/IndicadoresDefault.css";

const GLOBAL_COLORS = ["#0056b3","#1976d2","#1b7a4a","#388e3c","#ef6c00","#c62828","#6a1b9a","#00838f"];
const TIME_COLORS = ["#1976d2", "#e53935", "#43a047", "#fb8c00", "#8e24aa", "#00acc1", "#3949ab", "#f4511e"];

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

// Construye tendencia acumulada por día rellenando días sin datos con el último valor
// Construye tendencia acumulada por día usando la fecha real (YYYY-MM-DD) como eje X
function buildCategoryTrend(datasetsForCategory) {
  if (!datasetsForCategory.length) {
    // Fallback: dos puntos ficticios para que la línea sea visible
    const today = new Date().toISOString().slice(0, 10);
    return [{ date: today, value: 0 }];
  }

  // Contar cuántos datasets se publicaron cada día
  const dayCount = {};
  datasetsForCategory.forEach(ds => {
    const d = new Date(ds.created_at || ds.updated_at || "");
    if (isNaN(d)) return;
    const key = d.toISOString().slice(0, 10); // "YYYY-MM-DD"
    dayCount[key] = (dayCount[key] || 0) + 1;
  });

  const keys = Object.keys(dayCount).sort();
  if (!keys.length) {
    const today = new Date().toISOString().slice(0, 10);
    return [{ date: today, value: 0 }];
  }

  // Si solo hay un día con datos, agregamos un punto inicial en 0 el día anterior
  if (keys.length === 1) {
    const prev = new Date(keys[0]);
    prev.setDate(prev.getDate() - 1);
    const prevKey = prev.toISOString().slice(0, 10);
    return [
      { date: prevKey, value: 0 },
      { date: keys[0], value: dayCount[keys[0]] },
    ];
  }

  // Rellenar TODOS los días entre el primero y el último con acumulado
  const start = new Date(keys[0]);
  const end   = new Date(keys[keys.length - 1]);
  const result = [];
  let cumulative = 0;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    cumulative += dayCount[key] || 0;
    result.push({ date: key, value: cumulative });
  }
  return result;
}

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
  const [mainView, setMainView] = useState("estado");
  const [activeTab, setActiveTab] = useState("tematico");
  const [timeFilter, setTimeFilter] = useState("general");
  // Sin filtro de fecha: todos los datasets se muestran siempre
  const filteredDatasets = datasets;

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

  // Lógica de Series de Tiempo
  const timeSeriesStats = useMemo(() => {
    if (!filteredDatasets.length) return { data: [], keys: [] };

    const timeMap = {};
    const allCategories = new Set();
    const allOrigins = new Set();

    filteredDatasets.forEach(ds => {
      if (!ds.fecha) return;
      const date = new Date(ds.fecha);
      if (isNaN(date.getTime())) return;
      const timeKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

      const catName = ds.categoria || ds.category?.name || "Sin Categoría";
      const originName = ds.institucion?.nombre || ds.institucion || "Institución Desconocida";

      allCategories.add(catName);
      allOrigins.add(originName);

      if (!timeMap[timeKey]) {
        timeMap[timeKey] = { period: timeKey, Total: 0 };
      }

      timeMap[timeKey].Total += 1;
      timeMap[timeKey][catName] = (timeMap[timeKey][catName] || 0) + 1;
      timeMap[timeKey][originName] = (timeMap[timeKey][originName] || 0) + 1;
    });

    let data = Object.values(timeMap).sort((a, b) => a.period.localeCompare(b.period));

    data = data.map(item => {
      const [year, month, day] = item.period.split('-');
      const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      const formattedPeriod = dateObj.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
      return { ...item, displayPeriod: formattedPeriod.charAt(0).toUpperCase() + formattedPeriod.slice(1) };
    });

    let accumTotal = 0;
    const accumCategories = {};
    const accumOrigins = {};

    data = data.map(item => {
      accumTotal += item.Total || 0;
      const newItem = { ...item, TotalAcumulado: accumTotal, displayPeriod: item.displayPeriod };
      
      allCategories.forEach(cat => {
        accumCategories[cat] = (accumCategories[cat] || 0) + (item[cat] || 0);
        newItem[`${cat}_acum`] = accumCategories[cat];
      });
      
      allOrigins.forEach(org => {
        accumOrigins[org] = (accumOrigins[org] || 0) + (item[org] || 0);
        newItem[`${org}_acum`] = accumOrigins[org];
      });

      return newItem;
    });

    return {
      data,
      categoryKeys: Array.from(allCategories),
      originKeys: Array.from(allOrigins)
    };
  }, [filteredDatasets]);

  // Lógica Tabular
  const thematicStats = useMemo(() => {
    if (!filteredDatasets.length) return { total: 0, data: [] };
    const total = filteredDatasets.length;
    const categoryCount = {};

    filteredDatasets.forEach(ds => {
      const cat = ds.categoria || ds.category?.name || "Sin Categoría";
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    const categoryDatasets = {};
    filteredDatasets.forEach(ds => {
      const cat = ds.categoria || ds.category?.name || "Sin Categoría";
      if (!categoryDatasets[cat]) categoryDatasets[cat] = [];
      categoryDatasets[cat].push(ds);
    });

    const data = Object.entries(categoryCount)
      .map(([name, count], index) => ({
        name, count,
        percentage: (count / total) * 100,
        color: GLOBAL_COLORS[index % GLOBAL_COLORS.length],
        trend: buildCategoryTrend(categoryDatasets[name] || []),
      }))
      .sort((a, b) => b.count - a.count);

    return { total, data };
  }, [filteredDatasets]);

  const originStats = useMemo(() => {
    if (!filteredDatasets.length) return { total: 0, data: [] };
    const total = filteredDatasets.length;
    const instMap = {};

    filteredDatasets.forEach(ds => {
      const instName = ds.institucion?.nombre || ds.institucion || "Institución Desconocida";
      const catName = ds.categoria || ds.category?.name || "Sin Categoría";
      const dateStr = ds.updated_at || ds.created_at;

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
       const topCat = Object.entries(info.categories).sort((a, b) => b[1] - a[1])[0][0];
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
  }, [filteredDatasets]);

  const handleDatasetClick = (datasetId) => {
    navigate(`/indicadores/analisis`, { state: { selectedDatasetId: datasetId } });
  };

  const TimeTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="time-chart-tooltip">
          <p className="tooltip-date">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="tooltip-row">
              <span className="tooltip-color" style={{ backgroundColor: entry.color }}></span>
              <span className="tooltip-name">{entry.name.replace('_acum', '')}:</span>
              <span className="tooltip-value">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <main className="indicadores-default-page">
      <Breadcrumb paths={["Inicio", "Indicadores Globales"]} />

      <section className="ind-hero">
        <div className="ind-hero-text">
          <h1>Dashboard de Indicadores Globales</h1>
          <p>Visión general del estado de los datos en el Observatorio. Selecciona el tipo de análisis que deseas visualizar.</p>
        </div>
        
        {/* ==========================================
            NUEVO: Controles principales (Reemplaza el badge estático)
            ========================================== */}
        <div className="ind-hero-controls">
          <button 
            className={`hero-toggle-btn ${mainView === 'estado' ? 'active' : ''}`}
            onClick={() => setMainView('estado')}
          >
            <Activity size={32} strokeWidth={1.5} />
            <span>Estado Actual</span>
          </button>
          
          <button 
            className={`hero-toggle-btn ${mainView === 'evolucion' ? 'active' : ''}`}
            onClick={() => setMainView('evolucion')}
          >
            <LineChartIcon size={32} strokeWidth={1.5} />
            <span>Evolución con el tiempo</span>
          </button>
        </div>
      </section>

      <hr className="ind-separator" />


      {loading ? (
        <div className="ind-loading">
          <Loader2 size={40} className="spin" />
          <p>Cargando panorama global...</p>
        </div>
      ) : (
        <div className="ind-global-content fade-in">
          
          {/* ==========================================
              VISTA 1: EVOLUCIÓN CON EL TIEMPO
              ========================================== */}
          {mainView === 'evolucion' && (
            <section className="time-analysis-section chart-card fade-in">
              <div className="chart-header-row time-header">
                <div>
                  <h2 className="chart-title">Evolución de Publicaciones en el Tiempo</h2>
                  <p className="chart-subtitle">Crecimiento acumulado de conjuntos de datos en la plataforma.</p>
                </div>
                
                <div className="time-filter-wrap">
                  <Filter size={16} className="filter-icon" />
                  <select 
                    className="time-select" 
                    value={timeFilter} 
                    onChange={(e) => setTimeFilter(e.target.value)}
                  >
                    <option value="general">Crecimiento General</option>
                    <option value="categoria">Por Categoría Temática</option>
                    <option value="origen">Por Institución (Origen)</option>
                  </select>
                </div>
              </div>

              <div className="main-time-chart">
                <ResponsiveContainer width="100%" height={400}>
                  {timeFilter === "general" ? (
                    <AreaChart data={timeSeriesStats.data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0056b3" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#0056b3" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                      <XAxis dataKey="displayPeriod" tick={{fontSize: 11, fill: '#666'}} tickMargin={10} angle={-35} textAnchor="end" height={55} interval="preserveStartEnd" />
                      <YAxis tick={{fontSize: 11, fill: '#666'}} width={40} allowDecimals={false} tickCount={undefined} />
                      <Tooltip content={<TimeTooltip />} />
                      <Area type="monotone" dataKey="TotalAcumulado" name="Total Datasets" stroke="#0056b3" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" activeDot={{ r: 6 }} />
                    </AreaChart>
                  ) : (
                    <LineChart data={timeSeriesStats.data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                      <XAxis dataKey="displayPeriod" tick={{fontSize: 11, fill: '#666'}} tickMargin={10} angle={-35} textAnchor="end" height={55} interval="preserveStartEnd" />
                      <YAxis tick={{fontSize: 11, fill: '#666'}} width={40} allowDecimals={false} tickCount={undefined} />
                      <Tooltip content={<TimeTooltip />} />
                      <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '13px' }} />
                      
                      {timeFilter === "categoria" && timeSeriesStats.categoryKeys.map((key, index) => (
                        <Line key={key} type="monotone" dataKey={`${key}_acum`} name={key} stroke={TIME_COLORS[index % TIME_COLORS.length]} strokeWidth={2.5} dot={false} activeDot={{ r: 6 }} />
                      ))}

                      {timeFilter === "origen" && timeSeriesStats.originKeys.map((key, index) => (
                        <Line key={key} type="monotone" dataKey={`${key}_acum`} name={key} stroke={TIME_COLORS[index % TIME_COLORS.length]} strokeWidth={2.5} dot={false} activeDot={{ r: 6 }} />
                      ))}
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {/* ==========================================
              VISTA 2: ESTADO ACTUAL (Tablas)
              ========================================== */}
          {mainView === 'estado' && (
            <div className="estado-actual-section fade-in">
              <div className="ind-tabs-container" style={{ marginTop: 0 }}>
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

              <div className="status-table-container mt-4">
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
                              <LineChart width={130} height={42} data={cat.trend} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
                                <XAxis dataKey="date" hide type="category" />
                                <YAxis hide domain={[0, 'dataMax']} />
                                <Line type="monotone" dataKey="value" stroke={cat.color} strokeWidth={2.5} dot={{ r: 3, fill: cat.color }} isAnimationActive={false} />
                              </LineChart>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

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
            </div>
          )}

          <hr className="ind-separator" />

         
        </div>
      )}
    </main>
  );
}

export default IndicadoresDefault;