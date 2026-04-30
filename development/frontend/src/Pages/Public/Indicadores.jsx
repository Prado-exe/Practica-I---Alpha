import { useState, useMemo, useCallback, useEffect } from "react";
import {
  PieChart, Pie, Cell, Tooltip,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend,
  LineChart, Line,
} from "recharts";
import {
  Database, Globe, TrendingUp,
  FileText, Layers, ChevronDown, AlertCircle, Loader2,
  BarChart2, Table2, RefreshCcw,
} from "lucide-react";
import { useLocation } from "react-router-dom"; // Añade esta importación arriba
import Breadcrumb from "../../Components/Common/Breadcrumb";
import { useDataset } from "../../hooks/useDataset";
import { TYPE_LABELS } from "../../utils/columnMapper";
import { getDatasets } from "../../Services/DatasetService"; 
import "../../Styles/Pages_styles/Public/Indicadores.css";



/* ─── palette for charts ─── */
const CHART_COLORS = ["#0056b3","#1976d2","#1b7a4a","#388e3c","#6a1b9a","#c62828","#ef6c00","#00838f"];

/* ─── formatters para evitar desbordes y limpiar números ─── */
function formatAxisNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num;
}

function formatAxisText(text) {
  if (!text) return "";
  const str = String(text);
  return str.length > 12 ? str.substring(0, 12) + "…" : str;
}

// NUEVO: Limpia símbolos de moneda y comas para poder sumar los números
function cleanNumeric(val) {
  if (val == null || val === "") return 0;
  if (typeof val === "number") return val;
  const cleaned = String(val).replace(/[^0-9.-]+/g, "");
  return Number(cleaned) || 0;
}

/* ─── aggregation helpers ─── */
function groupBySum(data, groupCol, valueCol, limit = 20) {
  if (!data.length || !groupCol || !valueCol) return [];
  const acc = {};
  for (const row of data) {
    const key = String(row[groupCol] ?? "Sin valor");
    // Usamos cleanNumeric para asegurar que no falle con números como "$1.000"
    acc[key] = (acc[key] ?? 0) + cleanNumeric(row[valueCol]);
  }
  return Object.entries(acc)
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

function computeGeneralStats(data, columns) {
  if (!data.length || !columns.length) return [];

  const stats = [];

  const numericCols = [];
  const categoricalCols = [];

  for (const col of columns) {
    const vals = data.map(r => r[col]).filter(v => v != null && v !== "");
    if (!vals.length) continue;
    const numericVals = vals.map(cleanNumeric).filter(v => !isNaN(v) && isFinite(v));
    if (numericVals.length >= vals.length * 0.6) {
      numericCols.push({ col, vals: numericVals });
    } else {
      categoricalCols.push({ col, vals });
    }
  }

  stats.push({
    id: "total",
    label: "Total registros",
    value: data.length.toLocaleString("es-CL"),
    sub: `${numericCols.length} col. numérica(s) · ${categoricalCols.length} categórica(s)`,
    icon: Database,
    color: "#0056b3",
  });

  for (const { col, vals } of numericCols.slice(0, 3)) {
    const sum = vals.reduce((a, b) => a + b, 0);
    const avg = sum / vals.length;
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    stats.push({
      id: `num_${col}`,
      label: `Promedio — ${col}`,
      value: avg.toLocaleString("es-CL", { maximumFractionDigits: 1 }),
      sub: `Mín: ${formatAxisNumber(min)} · Máx: ${formatAxisNumber(max)}`,
      icon: TrendingUp,
      color: "#1b7a4a",
    });
  }

  for (const { col, vals } of categoricalCols.slice(0, 2)) {
    const unique = new Set(vals.map(v => String(v))).size;
    stats.push({
      id: `cat_${col}`,
      label: `Únicos — ${col}`,
      value: unique.toLocaleString("es-CL"),
      sub: `de ${vals.length.toLocaleString("es-CL")} registros con valor`,
      icon: Layers,
      color: "#6a1b9a",
    });
  }

  return stats;
}

/* ─── sub-components ─── */
function StatCard({ stat }) {
  const Icon = stat.icon;
  return (
    <article className="ind-kpi-card" style={{ "--kpi-color": stat.color }}>
      <div className="kpi-icon-wrap"><Icon size={26} /></div>
      <div className="kpi-body">
        <p className="kpi-label">{stat.label}</p>
        <p className="kpi-value">{stat.value}</p>
        <p className="kpi-sub neutral">{stat.sub}</p>
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
          const type  = mapping.all?.[col] ?? "unknown";
          const meta  = TYPE_LABELS[type] || TYPE_LABELS.unknown;
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
        <dt>Registros</dt>    <dd>{metadata.rows?.toLocaleString("es-CL")}</dd>
        <dt>Columnas</dt>     <dd>{metadata.cols}</dd>
        <dt>Tamaño</dt>       <dd>{metadata.sizeKb} KB</dd>
        <dt>Actualización</dt><dd>{metadata.lastUpdated}</dd>
        <dt>ODS</dt>          <dd>{metadata.ods?.join(", ") || "—"}</dd>
      </dl>
    </div>
  );
}

function EmptyState({ onSelect, datasets }) {
  return (
    <div className="ind-empty">
      <BarChart2 size={56} strokeWidth={1} />
      <h3>Selecciona un dataset para comenzar</h3>
      <p>Elige uno de los conjuntos de datos disponibles en el panel lateral para visualizar sus indicadores y gráficos de forma automática.</p>
      <div className="empty-dataset-grid">
        {datasets.slice(0, 6).map(ds => (
          <button key={ds.dataset_id} className="empty-ds-btn" onClick={() => onSelect(ds.dataset_id)} style={{ "--ds-color": ds.color || '#0056b3' }}>
            <span className="ds-cat">{ds.categoria || "Dataset"}</span>
            <span className="ds-name">{ds.nombre}</span>
          </button>
        ))}
      </div>
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

/* ─── date helpers ─── */
function parseRowDate(val) {
  if (val == null || val === "") return null;
  const s = String(val).trim();
  // YYYY, YYYY-MM, YYYY-MM-DD, DD/MM/YYYY
  const iso = s.match(/^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/);
  if (iso) {
    const [, y, m = "01", d = "01"] = iso;
    return new Date(`${y}-${m}-${d}T00:00:00`);
  }
  const dmy = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return new Date(`${y}-${m}-${d}T00:00:00`);
  }
  const fallback = new Date(s);
  return isNaN(fallback) ? null : fallback;
}

/* ─── Main component ─── */

function Indicadores() {
  const location = useLocation();
  const [selectedId, setSelectedId] = useState(location.state?.selectedDatasetId || null);
  const [lastManifest, setLastManifest] = useState(null);
  const [availableDatasets, setAvailableDatasets] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  const { data, columns, mapping, metadata, loading, error, loadDataset } = useDataset();

  // Cargar lista de Datasets desde la API al montar
  useEffect(() => {
    async function fetchDatasets() {
      setLoadingList(true);
      try {
        const response = await getDatasets({ limit: 100 });
        setAvailableDatasets(response.data || []);
      } catch (err) {
        console.error("Error al cargar la lista de datasets:", err);
      } finally {
        setLoadingList(false);
      }
    }
    fetchDatasets();
  }, []);

  const handleSelect = useCallback(async (id) => {
  if (!id) return;
  setSelectedId(id);

  try {
    // 1. Buscamos el detalle completo del dataset por ID
    // Esto es necesario porque el listado general no trae el array 'files'
    const { getPublicDatasetById } = await import("../../Services/DatasetService");
    const fullDs = await getPublicDatasetById(id);

    console.log(`👀 Procesando Dataset: ${fullDs.nombre || fullDs.title}`);
    console.log("📦 Detalle completo recuperado:", fullDs);

    // 🚨 CONFIGURACIÓN DE MINIO
    const MINIO_ENDPOINT = "http://localhost:9000";
    const MINIO_BUCKET = "observatory-files";

    /**
     * 🔍 DETECCIÓN DINÁMICA:
     * El objeto devuelto por el backend tiene un array 'files'.
     * Buscamos el archivo marcado como principal (is_primary) o el primero disponible.
     */
    const primaryFile = fullDs.files?.find(f => f.is_primary) || fullDs.files?.[0];
    
    if (!primaryFile) {
      throw new Error("Este dataset no tiene archivos cargados.");
    }

    // Extraemos la URL (el backend ya debería haber reemplazado 'storage' por 'localhost')
    let finalUrl = primaryFile.file_url || "";

    // Si por alguna razón la URL viene con el nombre interno de la red de Docker:
    if (finalUrl.includes('storage:9000')) {
      finalUrl = finalUrl.replace('storage:9000', 'localhost:9000');
    }

    // PLAN B: Si no hay URL pero hay una 'storage_key', la armamos manualmente
    if (!finalUrl && primaryFile.storage_key) {
      finalUrl = `${MINIO_ENDPOINT}/${MINIO_BUCKET}/${primaryFile.storage_key.replace(/^\//, '')}`;
    }

    console.log("🔗 URL Generada Dinámicamente:", finalUrl);

    if (!finalUrl) {
      throw new Error("No se pudo determinar una URL de descarga válida.");
    }

    // Preparamos el objeto para el hook useDataset
    const formattedManifest = {
      ...fullDs,
      url: finalUrl,
      name: fullDs.nombre || fullDs.title,
      category: fullDs.categoria || (fullDs.category?.name),
      description: fullDs.descripcion || fullDs.summary,
      format: primaryFile.file_format || "CSV",
      file: primaryFile.display_name || "archivo.csv"
    };

    // 🚀 Cargamos los datos reales del CSV
    loadDataset(formattedManifest);

  } catch (err) {
    console.error("❌ Error al procesar el dataset:", err.message);
    // Notificamos al hook para que muestre el error en la interfaz
    loadDataset({ url: "", error: err.message });
  }
}, [loadDataset]);

  const handleRetry = useCallback(() => {
    if (lastManifest) loadDataset(lastManifest);
  }, [lastManifest, loadDataset]);

  // Reset date range when a new dataset is selected
  useEffect(() => { setDateRange({ start: "", end: "" }); }, [selectedId]);

  // 🚨 2. AUTO-MAPEO SEGURO (Garantiza que siempre haya columnas para graficar)
  const safeMapping = useMemo(() => {
    if (!data || !data.length || !columns || !columns.length) return mapping;
    
    let bestCat = columns.find(c => 
      c.toLowerCase().includes("categor") || c.toLowerCase().includes("tipo") || 
      c.toLowerCase().includes("nombre") || c.toLowerCase().includes("region")
    );
    if (!bestCat) {
       bestCat = columns.find(c => typeof data[0][c] === "string" && isNaN(Number(data[0][c]))) || columns[0];
    }

    let bestNum = columns.find(c => 
      c.toLowerCase().includes("valor") || c.toLowerCase().includes("monto") || 
      c.toLowerCase().includes("total") || c.toLowerCase().includes("cantidad")
    );
    if (!bestNum) {
      bestNum = columns.find(c => {
         const val = data[0][c];
         return typeof val === "number" || !isNaN(cleanNumeric(val));
      }) || columns[1] || columns[0];
    }

    return { ...mapping, categoryCol: bestCat, primaryNumericCol: bestNum };
  }, [data, columns, mapping]);

  // Filtered data: apply date range when a timeCol is detected
  const filteredData = useMemo(() => {
    const timeCol = safeMapping?.timeCol;
    if (!timeCol || (!dateRange.start && !dateRange.end)) return data;
    const start = dateRange.start ? new Date(dateRange.start + "T00:00:00") : null;
    const end   = dateRange.end   ? new Date(dateRange.end   + "T23:59:59") : null;
    return data.filter(row => {
      const d = parseRowDate(row[timeCol]);
      if (!d) return true; // keep rows with unparseable dates
      if (start && d < start) return false;
      if (end   && d > end)   return false;
      return true;
    });
  }, [data, safeMapping, dateRange]);

  // Utilizamos safeMapping y filteredData para calcular las agrupaciones
  const generalStats = useMemo(() => computeGeneralStats(filteredData, columns), [filteredData, columns]);
  const pieData = useMemo(() => groupBySum(filteredData, safeMapping?.categoryCol, safeMapping?.primaryNumericCol, 8), [filteredData, safeMapping]);
  const barData = useMemo(() => groupBySum(filteredData, safeMapping?.regionCol || safeMapping?.categoryCol, safeMapping?.primaryNumericCol, 16), [filteredData, safeMapping]);
  const lineData = useMemo(() => {
    if (!safeMapping?.timeCol) return [];
    const raw = groupBySum(filteredData, safeMapping.timeCol, safeMapping.primaryNumericCol, 24);
    return raw.sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }, [filteredData, safeMapping]);

  const isDateFiltered = dateRange.start || dateRange.end;
  const hasData    = !loading && !error && data.length > 0;
  const hasBarData = hasData && barData.length > 0;
  const hasPieData = hasData && pieData.length > 0;
  const hasLine    = hasData && lineData.length > 1;

  return (
    <main className="indicadores-page">
      <Breadcrumb paths={["Inicio", "Indicadores"]} />

      <section className="ind-hero">
        <div className="ind-hero-text">
          <h1>Dashboard de Indicadores</h1>
          <p>Selecciona un dataset del catálogo para visualizar automáticamente sus KPIs, gráficos de distribución y tendencias.</p>
        </div>
        <div className="ind-hero-badge"><Globe size={44} strokeWidth={1.4} /><span>Observatorio de Datos Sostenibles</span></div>
      </section>

      <hr className="ind-separator" />

      <div className="ind-dashboard">
        <aside className="ind-sidebar">
          <div className="sidebar-section">
            <p className="panel-title"><Database size={13} /> 1. Seleccionar dataset</p>
            <div className="select-wrap">
              <select
                className="dataset-select"
                value={selectedId ?? ""}
                onChange={e => handleSelect(e.target.value)}
                aria-label="Seleccionar dataset"
                disabled={loadingList}
              >
                <option value="" disabled>
                  {loadingList ? "Cargando datasets..." : "-- Elige un dataset --"}
                </option>
                {availableDatasets.map(ds => (
                  <option key={ds.dataset_id} value={ds.dataset_id}>{ds.nombre}</option>
                ))}
              </select>
              <ChevronDown size={16} className="select-chevron" />
            </div>
            {selectedId && (
              <p className="dataset-desc">
                {availableDatasets.find(d => String(d.dataset_id) === String(selectedId))?.descripcion}
              </p>
            )}
          </div>

          {safeMapping?.timeCol && hasData && (
            <div className="sidebar-section">
              <p className="panel-title"><TrendingUp size={13} /> 2. Filtrar por fecha</p>
              <label className="date-filter-label" htmlFor="date-start">Desde</label>
              <input
                id="date-start"
                type="date"
                className="date-filter-input"
                value={dateRange.start}
                onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              />
              <label className="date-filter-label" htmlFor="date-end">Hasta</label>
              <input
                id="date-end"
                type="date"
                className="date-filter-input"
                value={dateRange.end}
                onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              />
              {isDateFiltered && (
                <button
                  className="retry-btn"
                  style={{ marginTop: "8px", width: "100%" }}
                  onClick={() => setDateRange({ start: "", end: "" })}
                >
                  Limpiar filtro
                </button>
              )}
            </div>
          )}

          {metadata && <MetadataPanel metadata={metadata} />}
          {safeMapping && columns.length > 0 && <MappingPanel mapping={safeMapping} columns={columns} />}
        </aside>

        <div className="ind-main">
          {loading && <LoadingState />}
          {!loading && error && <ErrorState error={error} onRetry={handleRetry} />}
          {!loading && !error && !selectedId && <EmptyState onSelect={handleSelect} datasets={availableDatasets} />}
          {!loading && !error && selectedId && !data.length && (
            <div className="ind-loading"><p>Sin datos para mostrar.</p></div>
          )}
          {hasData && filteredData.length === 0 && (
            <div className="ind-error" style={{ gap: "12px" }}>
              <AlertCircle size={36} />
              <h3>Sin resultados para el rango seleccionado</h3>
              <p>No hay registros entre las fechas indicadas. Ajusta el rango o <button className="retry-btn" onClick={() => setDateRange({ start: "", end: "" })}>limpia el filtro</button>.</p>
            </div>
          )}

          {hasData && filteredData.length > 0 && (
            <>
              <section className="ind-kpis" aria-label="Estadísticas generales">
                {generalStats.map(s => <StatCard key={s.id} stat={s} />)}
              </section>

              <div className="ind-charts-row">
                {hasPieData && (
                  <div className="chart-card">
                    <h2 className="chart-title">Distribución por {safeMapping.categoryCol}</h2>
                    <p className="chart-subtitle">Suma de {safeMapping.primaryNumericCol} agrupada por categoría</p>
                    <ResponsiveContainer width="100%" height={270}>
                      <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <Pie data={pieData} cx="35%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value">
                          {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                        <Legend 
                          layout="vertical" 
                          verticalAlign="middle" 
                          align="right"
                          wrapperStyle={{ width: "55%", paddingLeft: "10px", lineHeight: "24px" }} 
                          formatter={v => <span style={{ fontSize: "0.75rem", color: "#444" }}>{v}</span>} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {hasBarData && (
                  <div className={`chart-card ${hasPieData ? "" : "chart-card--full"}`}>
                    <h2 className="chart-title">Por {safeMapping.regionCol ?? safeMapping.categoryCol}</h2>
                    <p className="chart-subtitle">Suma de {safeMapping.primaryNumericCol} por dimensión regional</p>
                    <ResponsiveContainer width="100%" height={270}>
                      <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <Pie
                          data={barData}
                          cx="35%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {barData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                        <Legend
                          layout="vertical"
                          verticalAlign="middle"
                          align="right"
                          wrapperStyle={{ width: "55%", paddingLeft: "10px", lineHeight: "24px" }}
                          formatter={v => <span style={{ fontSize: "0.75rem", color: "#444" }}>{formatAxisText(v)}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {hasLine && (
                <div className="chart-card">
                  <div className="chart-header-row">
                    <div>
                      <h2 className="chart-title">Evolución temporal — {safeMapping.timeCol}</h2>
                      <p className="chart-subtitle">Suma de {safeMapping.primaryNumericCol} por período</p>
                    </div>
                    <div className="chart-stat-inline">
                      <TrendingUp size={16} color="#1b7a4a" />
                      <span>{lineData.length} períodos</span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={lineData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#555" }} tickFormatter={formatAxisText} />
                      <YAxis tick={{ fontSize: 11, fill: "#555" }} tickFormatter={formatAxisNumber} width={45} />
                      <Tooltip content={<ChartTooltip />} />
                      <Line type="monotone" dataKey="value" stroke="#0056b3" strokeWidth={2.5}
                        dot={{ r: 4, fill: "#0056b3" }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              <DataTable data={filteredData} columns={columns} />
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default Indicadores;