import { useState, useMemo, useCallback, useEffect } from "react";
import {
  PieChart, Pie, Cell, Tooltip, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend,
  LineChart, Line,
} from "recharts";
import {
  Database, CheckCircle, Hash, Globe, TrendingUp, TrendingDown,
  Minus, FileText, Layers, ChevronDown, AlertCircle, Loader2,
  BarChart2, Table2, RefreshCcw, FileBox
} from "lucide-react";
import Breadcrumb from "../../Components/Common/Breadcrumb";
// ❌ Borramos import { DATASETS }
import { useDataset } from "../../hooks/useDataset";
import { TYPE_LABELS } from "../../utils/columnMapper";
import { useAuth } from "../../Context/AuthContext"; // ✅ Agregamos Auth
import "../../Styles/Pages_styles/Public/Indicadores.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"; // ✅ Agregamos API

/* ─── palette for charts ─── */
const CHART_COLORS = ["#0056b3","#1976d2","#1b7a4a","#388e3c","#6a1b9a","#c62828","#ef6c00","#00838f"];

/* ─── aggregation helpers ─── */
function groupBySum(data, groupCol, valueCol, limit = 20) {
  if (!data.length || !groupCol || !valueCol) return [];
  const acc = {};
  for (const row of data) {
    const key = String(row[groupCol] ?? "Sin valor");
    acc[key] = (acc[key] ?? 0) + (Number(row[valueCol]) || 0);
  }
  return Object.entries(acc)
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

function computeKpis(data, mapping) {
  if (!data.length || !mapping) return [];
  const { primaryNumericCol, categoryCol, regionCol, variationCol, numericCols } = mapping;
  const kpis = [];

  kpis.push({
    id: "total",
    label: "Total registros",
    value: data.length.toLocaleString("es-CL"),
    rawValue: data.length,
    sub: `${mapping.numericCols.length} columna(s) numéricas detectadas`,
    trend: "neutral",
    icon: Database,
    color: "#0056b3",
  });

  if (primaryNumericCol) {
    const nums = data.map(r => Number(r[primaryNumericCol])).filter(v => !isNaN(v));
    const sum  = nums.reduce((a, b) => a + b, 0);
    const avg  = nums.length ? sum / nums.length : 0;

    kpis.push({
      id: "sum",
      label: `Total — ${primaryNumericCol}`,
      value: Math.round(sum).toLocaleString("es-CL"),
      rawValue: sum,
      sub: "suma del período",
      trend: "up",
      icon: TrendingUp,
      color: "#1b7a4a",
    });

    kpis.push({
      id: "avg",
      label: `Promedio — ${primaryNumericCol}`,
      value: avg.toFixed(1).toLocaleString("es-CL"),
      rawValue: avg,
      sub: "por registro",
      trend: "neutral",
      icon: Minus,
      color: "#6a1b9a",
    });
  }

  if (variationCol) {
    const vars = data.map(r => Number(r[variationCol])).filter(v => !isNaN(v));
    const avgVar = vars.length ? vars.reduce((a, b) => a + b, 0) / vars.length : 0;
    kpis.push({
      id: "variation",
      label: `Variación media — ${variationCol}`,
      value: `${avgVar >= 0 ? "+" : ""}${avgVar.toFixed(1)}%`,
      rawValue: avgVar,
      sub: "respecto período anterior",
      trend: avgVar >= 0 ? "up" : "down",
      icon: avgVar >= 0 ? TrendingUp : TrendingDown,
      color: avgVar >= 0 ? "#1b7a4a" : "#c62828",
    });
  } else if (categoryCol) {
    const unique = new Set(data.map(r => r[categoryCol])).size;
    kpis.push({
      id: "categories",
      label: `Categorías — ${categoryCol}`,
      value: unique.toLocaleString("es-CL"),
      rawValue: unique,
      sub: "valores únicos",
      trend: "neutral",
      icon: Layers,
      color: "#c62828",
    });
  } else if (regionCol) {
    const unique = new Set(data.map(r => r[regionCol])).size;
    kpis.push({
      id: "regions",
      label: "Regiones cubiertas",
      value: unique.toLocaleString("es-CL"),
      rawValue: unique,
      sub: "en este dataset",
      trend: "neutral",
      icon: Globe,
      color: "#c62828",
    });
  }

  return kpis;
}

/* ─── sub-components ─── */

function KpiCard({ kpi }) {
  const Icon = kpi.icon;
  return (
    <article className="ind-kpi-card" style={{ "--kpi-color": kpi.color }}>
      <div className="kpi-icon-wrap"><Icon size={26} /></div>
      <div className="kpi-body">
        <p className="kpi-label">{kpi.label}</p>
        <p className="kpi-value">{kpi.value}</p>
        <p className={`kpi-sub ${kpi.trend}`}>{kpi.sub}</p>
      </div>
    </article>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label ?? payload[0].name}</p>
      <p className="tooltip-value">{Number(payload[0].value).toLocaleString("es-CL")}</p>
    </div>
  );
}

function MappingPanel({ mapping, columns }) {
  return (
    <div className="mapping-panel">
      <p className="panel-title"><Layers size={13} /> Mapeo de columnas</p>
      <ul className="mapping-list">
        {columns.map(col => {
          const type  = mapping.all[col] ?? "unknown";
          const meta  = TYPE_LABELS[type];
          const isPrimary = col === mapping.primaryNumericCol || col === mapping.regionCol || col === mapping.timeCol || col === mapping.categoryCol;
          return (
            <li key={col} className={`mapping-row ${isPrimary ? "primary" : ""}`}>
              <span className="mapping-emoji">{meta.emoji}</span>
              <span className="mapping-col">{col}</span>
              <span className="mapping-type">{meta.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function MetadataPanel({ metadata }) {
  return (
    <div className="metadata-panel">
      <p className="panel-title"><FileText size={13} /> Estado del dataset</p>
      <dl className="meta-list">
        <dt>Archivo</dt>      <dd>{metadata.file}</dd>
        <dt>Formato</dt>      <dd><span className="meta-badge">{metadata.format}</span></dd>
        <dt>Categoría</dt>    <dd>{metadata.category}</dd>
        <dt>Registros</dt>    <dd>{metadata.rows.toLocaleString("es-CL")}</dd>
        <dt>Columnas</dt>     <dd>{metadata.cols}</dd>
        <dt>Tamaño</dt>       <dd>{metadata.sizeKb} KB</dd>
        <dt>Actualización</dt><dd>{metadata.lastUpdated}</dd>
        <dt>ODS</dt>          <dd>{metadata.ods?.join(", ") || "—"}</dd>
      </dl>
    </div>
  );
}

// ✅ Actualizamos el EmptyState para quitar la dependencia del archivo local
function EmptyState({ selectedDataset }) {
  return (
    <div className="ind-empty">
      <BarChart2 size={56} strokeWidth={1} />
      <h3>{selectedDataset ? "Ahora selecciona un archivo" : "Selecciona un dataset para comenzar"}</h3>
      <p>Elige uno de los conjuntos de datos disponibles en el panel lateral y luego el archivo que deseas analizar para visualizar sus indicadores y gráficos de forma automática.</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="ind-loading">
      <Loader2 size={40} className="spin" />
      <p>Cargando y analizando el archivo…</p>
    </div>
  );
}

function ErrorState({ error, onRetry }) {
  return (
    <div className="ind-error">
      <AlertCircle size={40} />
      <h3>Error al cargar</h3>
      <p>{error}</p>
      <button className="retry-btn" onClick={onRetry}><RefreshCcw size={14} /> Reintentar</button>
    </div>
  );
}

function DataTable({ data, columns }) {
  const preview = data.slice(0, 8);
  return (
    <div className="chart-card">
      <div className="chart-header-row">
        <div>
          <h2 className="chart-title">Vista previa de datos</h2>
          <p className="chart-subtitle">Primeros {preview.length} de {data.length.toLocaleString("es-CL")} registros</p>
        </div>
        <Table2 size={20} color="#888" />
      </div>
      <div className="table-scroll">
        <table className="preview-table">
          <thead>
            <tr>{columns.map(c => <th key={c}>{c}</th>)}</tr>
          </thead>
          <tbody>
            {preview.map((row, i) => (
              <tr key={i}>
                {columns.map(c => (
                  <td key={c}>{row[c] == null ? "—" : String(row[c])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Main component ─── */

function Indicadores() {
  const { user } = useAuth(); // Para manejar público vs privado
  const [catalog, setCatalog] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [selectedFileId, setSelectedFileId] = useState("");

  const { data, columns, mapping, metadata, loading, error, loadFileContent } = useDataset();

  // ✅ Cargar catálogo dinámico al entrar a la página
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const headers = user?.token ? { "Authorization": `Bearer ${user.token}` } : {};
        const endpoint = user?.token ? '/api/datasets?limit=100' : '/api/public/datasets?limit=100';
        
        const res = await fetch(`${API_URL}${endpoint}`, { headers });
        if (res.ok) {
          const json = await res.json();
          setCatalog(json.data || []);
        }
      } catch (error) {
        console.error("Error al cargar el catálogo:", error);
      }
    };
    fetchCatalog();
  }, [user]);

  // ✅ Obtener detalles del dataset y sus archivos firmados
  const handleDatasetChange = async (datasetId) => {
    if (!datasetId) return;
    try {
      const headers = user?.token ? { "Authorization": `Bearer ${user.token}` } : {};
      const endpoint = user?.token ? `/api/datasets/${datasetId}` : `/api/public/datasets/${datasetId}`;
      
      const res = await fetch(`${API_URL}${endpoint}`, { headers });
      const { data: dbDataset } = await res.json();
      
      setSelectedDataset(dbDataset);
      setSelectedFileId(""); // Reseteamos el archivo al cambiar de dataset
    } catch (err) {
      console.error("Error al obtener detalle del dataset:", err);
    }
  };

  // ✅ Mandar a procesar el archivo seleccionado
  const handleFileChange = useCallback((fileId) => {
    const file = selectedDataset.files.find(f => String(f.aws_file_reference_id) === String(fileId));
    if (file) {
      setSelectedFileId(fileId);
      loadFileContent(file, selectedDataset);
    }
  }, [selectedDataset, loadFileContent]);

  const handleRetry = useCallback(() => {
    if (selectedFileId) handleFileChange(selectedFileId);
  }, [selectedFileId, handleFileChange]);

  const kpis    = useMemo(() => computeKpis(data, mapping), [data, mapping]);
  const pieData = useMemo(() => groupBySum(data, mapping?.categoryCol, mapping?.primaryNumericCol, 8), [data, mapping]);
  const barData = useMemo(() => groupBySum(data, mapping?.regionCol, mapping?.primaryNumericCol, 16), [data, mapping]);
  const lineData = useMemo(() => {
    if (!mapping?.timeCol) return [];
    const raw = groupBySum(data, mapping.timeCol, mapping.primaryNumericCol, 24);
    return raw.sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }, [data, mapping]);

  const hasData    = !loading && !error && data.length > 0;
  const hasBarData = hasData && barData.length > 0;
  const hasPieData = hasData && pieData.length > 0;
  const hasLine    = hasData && lineData.length > 1;

  return (
    <main className="indicadores-page">
      <Breadcrumb paths={["Inicio", "Indicadores"]} />

      {/* HERO */}
      <section className="ind-hero">
        <div className="ind-hero-text">
          <h1>Dashboard de Indicadores</h1>
          <p>Selecciona un dataset del catálogo para visualizar automáticamente sus KPIs, gráficos de distribución y tendencias.</p>
        </div>
        <div className="ind-hero-badge"><Globe size={44} strokeWidth={1.4} /><span>Observatorio de Datos Sostenibles</span></div>
      </section>

      <hr className="ind-separator" />

      {/* LAYOUT */}
      <div className="ind-dashboard">

        {/* SIDEBAR */}
        <aside className="ind-sidebar">

          {/* Dataset selector */}
          <div className="sidebar-section">
            <p className="panel-title"><Database size={13} /> 1. Seleccionar dataset</p>
            <div className="select-wrap">
              <select
                className="dataset-select"
                value={selectedDataset?.dataset_id ?? ""}
                onChange={e => handleDatasetChange(e.target.value)}
                aria-label="Seleccionar dataset"
              >
                <option value="" disabled>-- Elige un dataset --</option>
                {catalog.map(ds => (
                  <option key={ds.dataset_id} value={ds.dataset_id}>{ds.nombre}</option>
                ))}
              </select>
              <ChevronDown size={16} className="select-chevron" />
            </div>
          </div>

          {/* File selector */}
          {selectedDataset && (
            <div className="sidebar-section">
              <p className="panel-title"><FileBox size={13} /> 2. Seleccionar archivo</p>
              <div className="select-wrap">
                <select 
                  className="dataset-select" 
                  value={selectedFileId} 
                  onChange={e => handleFileChange(e.target.value)}
                  aria-label="Seleccionar archivo"
                >
                  <option value="" disabled>-- Elige un archivo --</option>
                  {selectedDataset.files?.map(f => (
                    <option key={f.aws_file_reference_id} value={f.aws_file_reference_id}>
                      {f.display_name} {f.file_format ? `(${f.file_format.toUpperCase()})` : ""}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="select-chevron" />
              </div>
            </div>
          )}

          {/* Metadata */}
          {metadata && <MetadataPanel metadata={metadata} />}

          {/* Column mapping */}
          {mapping && columns.length > 0 && (
            <MappingPanel mapping={mapping} columns={columns} />
          )}

        </aside>

        {/* MAIN CONTENT */}
        <div className="ind-main">

          {loading && <LoadingState />}

          {!loading && error && <ErrorState error={error} onRetry={handleRetry} />}

          {!loading && !error && !selectedFileId && <EmptyState selectedDataset={selectedDataset} />}

          {!loading && !error && selectedFileId && !data.length && !loading && (
            <div className="ind-loading"><p>Sin datos numéricos o geográficos para graficar en este archivo.</p></div>
          )}

          {hasData && (
            <>
              {/* KPI CARDS */}
              <section className="ind-kpis" aria-label="KPIs calculados">
                {kpis.map(kpi => <KpiCard key={kpi.id} kpi={kpi} />)}
              </section>

              {/* PIE + BAR */}
              <div className="ind-charts-row">
                {hasPieData && (
                  <div className="chart-card">
                    <h2 className="chart-title">Distribución por {mapping.categoryCol}</h2>
                    <p className="chart-subtitle">Suma de {mapping.primaryNumericCol} agrupada por categoría</p>
                    <ResponsiveContainer width="100%" height={270}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3} dataKey="value">
                          {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                        <Legend formatter={v => <span style={{ fontSize: "0.78rem", color: "#444" }}>{v}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {hasBarData && (
                  <div className={`chart-card ${hasPieData ? "" : "chart-card--full"}`}>
                    <h2 className="chart-title">Por {mapping.regionCol ?? mapping.categoryCol}</h2>
                    <p className="chart-subtitle">Suma de {mapping.primaryNumericCol} por dimensión regional</p>
                    <ResponsiveContainer width="100%" height={270}>
                      <BarChart data={barData} margin={{ top: 4, right: 12, left: -16, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#555" }} angle={-35} textAnchor="end" interval={0} />
                        <YAxis tick={{ fontSize: 11, fill: "#555" }} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="value" fill="#0056b3" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* LINE CHART */}
              {hasLine && (
                <div className="chart-card">
                  <div className="chart-header-row">
                    <div>
                      <h2 className="chart-title">Evolución temporal — {mapping.timeCol}</h2>
                      <p className="chart-subtitle">Suma de {mapping.primaryNumericCol} por período</p>
                    </div>
                    <div className="chart-stat-inline">
                      <TrendingUp size={16} color="#1b7a4a" />
                      <span>{lineData.length} períodos</span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={lineData} margin={{ top: 4, right: 20, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#555" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#555" }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Line type="monotone" dataKey="value" stroke="#0056b3" strokeWidth={2.5}
                        dot={{ r: 4, fill: "#0056b3" }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* DATA TABLE */}
              <DataTable data={data} columns={columns} />
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default Indicadores;