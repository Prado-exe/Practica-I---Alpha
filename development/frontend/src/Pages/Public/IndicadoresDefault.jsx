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

const resolveCategory = (ds) =>
  ds.category?.name ||
  ds.categoria ||
  ds.category_name ||
  "Sin Categoría";

const resolveInstitution = (ds) =>
  ds.institution?.name ||
  ds.institucion?.nombre ||
  ds.institution_name ||
  ds.institucion ||
  "Institución Desconocida";

const resolveDate = (ds) =>
  ds.created_at || ds.creation_date || ds.updated_at || null;

const generateRealTrend = (categoryName, allDatasets) => {
  const dayCount = {};

  allDatasets
    .filter(ds => resolveCategory(ds) === categoryName)
    .forEach(ds => {
      const dateStr = resolveDate(ds);
      if (!dateStr) return;
      const date = new Date(dateStr);
      if (isNaN(date)) return;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      dayCount[key] = (dayCount[key] || 0) + 1;
    });

  const keys = Object.keys(dayCount).sort();
  if (keys.length === 0) return [];

  const start = new Date(keys[0]);
  const end = new Date();

  const trend = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
    trend.push({ year: key, value: dayCount[key] || 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  return trend;
};

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

  const timeSeriesStats = useMemo(() => {
    if (!datasets.length) return { data: [], categoryKeys: [], originKeys: [] };

    const timeMap = {};
    const allCategories = new Set();
    const allOrigins = new Set();

    datasets.forEach(ds => {
      const dateStr = resolveDate(ds) || "2023-01-01T00:00:00Z";
      const date = new Date(dateStr);
      const timeKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      const catName = resolveCategory(ds);
      const originName = resolveInstitution(ds);

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
      const [year, month] = item.period.split('-');
      const dateObj = new Date(year, parseInt(month) - 1);
      const formattedPeriod = dateObj.toLocaleDateString('es-CL', { month: 'short', year: 'numeric' });
      return {
        ...item,
        displayPeriod: formattedPeriod.charAt(0).toUpperCase() + formattedPeriod.slice(1)
      };
    });

    let accumTotal = 0;
    const accumCategories = {};
    const accumOrigins = {};

    data = data.map(item => {
      accumTotal += item.Total || 0;
      const newItem = { ...item, TotalAcumulado: accumTotal };

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
  }, [datasets]);

  const thematicStats = useMemo(() => {
    if (!datasets.length) return { total: 0, data: [] };
    const total = datasets.length;
    const categoryCount = {};

    datasets.forEach(ds => {
      const cat = resolveCategory(ds);
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    const data = Object.entries(categoryCount)
      .map(([name, count], index) => ({
        name,
        count,
        percentage: (count / total) * 100,
        color: GLOBAL_COLORS[index % GLOBAL_COLORS.length],
        trend: generateRealTrend(name, datasets)
      }))
      .sort((a, b) => b.count - a.count);

    return { total, data };
  }, [datasets]);

  const originStats = useMemo(() => {
    if (!datasets.length) return { total: 0, data: [] };
    const total = datasets.length;
    const instMap = {};

    datasets.forEach(ds => {
      const instName = resolveInstitution(ds);
      const catName = resolveCategory(ds);
      const dateStr = resolveDate(ds);

      if (!instMap[instName]) {
        instMap[instName] = { count: 0, categories: {}, latestDate: null };
      }

      instMap[instName].count += 1;
      instMap[instName].categories[catName] = (instMap[instName].categories[catName] || 0) + 1;

      if (dateStr) {
        const current = new Date(dateStr);
        if (!isNaN(current) && (!instMap[instName].latestDate || current > instMap[instName].latestDate)) {
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
  }, [datasets]);

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
                      <XAxis dataKey="displayPeriod" tick={{fontSize: 11, fill: '#666'}} tickMargin={10} />
                      <YAxis tick={{fontSize: 11, fill: '#666'}} width={40} />
                      <Tooltip content={<TimeTooltip />} />
                      <Area type="monotone" dataKey="TotalAcumulado" name="Total Datasets" stroke="#0056b3" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" activeDot={{ r: 6 }} />
                    </AreaChart>
                  ) : (
                    <LineChart data={timeSeriesStats.data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                      <XAxis dataKey="displayPeriod" tick={{fontSize: 11, fill: '#666'}} tickMargin={10} />
                      <YAxis tick={{fontSize: 11, fill: '#666'}} width={40} />
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
                        <th>Tendencia por Día</th>
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
                                <LineChart data={cat.trend.length > 0 ? cat.trend : [{ year: 'a', value: 0 }, { year: 'b', value: 0 }]}>
                                  <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke={cat.trend.length > 0 ? cat.color : '#ddd'}
                                    strokeWidth={2.5}
                                    dot={false}
                                    isAnimationActive={false}
                                    connectNulls={true}
                                  />
                                </LineChart>
                              </ResponsiveContainer>
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
                    <span className="ds-cat">{resolveCategory(ds)}</span>
                    <h3 className="ds-name">{ds.title || ds.nombre}</h3>
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
