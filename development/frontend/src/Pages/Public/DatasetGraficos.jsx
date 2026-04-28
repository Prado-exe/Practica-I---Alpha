import { useEffect, useState, useMemo } from "react";
import { useParams,useLocation  } from "react-router-dom";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import {
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";

import {
  Filter, Layers, Plus, Trash2,
  Table as TableIcon, Database,
  Activity, Loader2, AlignLeft,
  ChevronRight, Info, BarChart2,
  Calendar, Tag
} from "lucide-react";

import { getPublicDatasetById } from "../../Services/DatasetService";
import "../../Styles/Pages_styles/Public/DatasetGraficos.css";



function DatasetGraficos() {
  const { id } = useParams();
  const COLORS = ["#0056b3", "#1976d2", "#1b7a4a", "#388e3c", "#6a1b9a", "#c62828", "#ef6c00", "#00838f"];
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const fileId = queryParams.get("fileId");

  const [datasetMeta, setDatasetMeta] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterColumn, setFilterColumn] = useState("");
  const [filterValue, setFilterValue] = useState("");

  const [chartsConfig, setChartsConfig] = useState([]);
  const [sheets, setSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [workbookData, setWorkbookData] = useState({});

  // ================= CSV/EXCEL LÓGICA (MANTENIDA) =================
  const detectDelimiter = (text) => {
    const lines = text.split("\n").slice(0, 5);
    const delimiters = [",", ";", "|", "\t"];
    let best = ",";
    let max = 0;
    delimiters.forEach(d => {
      const count = lines.reduce((acc, l) => acc + (l.split(d).length - 1), 0);
      if (count > max) { max = count; best = d; }
    });
    return best;
  };

  const inferType = (value) => {
    if (value === null || value === undefined || value === "") return "null";
    if (!isNaN(value)) return "number";
    if (value === "true" || value === "false") return "boolean";
    if (!isNaN(Date.parse(value))) return "date";
    return "string";
  };

  const normalizeValue = (value, type) => {
    if (type === "number") return Number(value);
    if (type === "boolean") return value === "true";
    if (type === "date") return new Date(value).toISOString();
    return String(value).trim();
  };

  const getColumnType = (col, sampleData) => {
    const sample = sampleData.slice(0, 30);
    const counts = { number: 0, string: 0, boolean: 0, date: 0 };
    sample.forEach(row => {
      const t = inferType(row[col]);
      if (counts[t] !== undefined) counts[t]++;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  };

  const processRows = (rows) => {
    if (!rows.length) return setData([]);
    const columns = Object.keys(rows[0]);
    const columnTypes = {};
    columns.forEach(col => {
      columnTypes[col] = getColumnType(col, rows);
    });
    const normalized = rows.map(row => {
      const obj = {};
      columns.forEach(col => {
        obj[col] = normalizeValue(row[col], columnTypes[col]);
      });
      return obj;
    });
    setData(normalized);
    if (chartsConfig.length === 0) {
      setChartsConfig(generateSmartCharts(normalized, columns));
    }
  };

  // ================= SMART CHARTS =================
  const generateSmartCharts = (data, cols) => {
    const numeric = cols.filter(c => getColumnType(c, data) === "number");
    const string = cols.filter(c => getColumnType(c, data) === "string");
    const date = cols.filter(c => getColumnType(c, data) === "date");
    const charts = [];

    if (string.length) {
      charts.push({
        id: Date.now(),
        type: "bar",
        x: string[0],
        y: string[0],
        aggregation: "count"
      });
    }

    numeric.forEach((num, i) => {
      if (string[0]) {
        charts.push({
          id: Date.now() + i + 1,
          type: "bar",
          x: string[0],
          y: num,
          aggregation: "sum"
        });
      }
    });

    return charts;
  };

  const flattenObject = (obj, prefix = "") => {
    let res = {};
    for (let key in obj) {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (typeof item === "object" && item !== null) {
            Object.assign(res, flattenObject(item, `${newKey}.${index}`));
          } else {
            res[`${newKey}.${index}`] = item;
          }
        });
      } else if (typeof value === "object" && value !== null) {
        Object.assign(res, flattenObject(value, newKey));
      } else {
        res[newKey] = value;
      }
    }
    return res;
  };
  const extractArrayFromJSON = (json) => {
    if (Array.isArray(json)) return json;

    for (let key in json) {
      if (Array.isArray(json[key])) return json[key];
    }

    return [json];
  };
  const processJSON = (jsonData) => {
    const baseArray = extractArrayFromJSON(jsonData);
    const flattened = baseArray.map(item => flattenObject(item));
    processRows(flattened);
  };

  const buildGroupedData = (data, xKey, yKey, aggregation) => {
    const grouped = {};
    const yType = getColumnType(yKey, data);
    data.forEach(row => {
      const key = row[xKey] ?? "N/A";
      if (!grouped[key]) {
        grouped[key] = { sum: 0, count: 0, values: [] };
      }
      const val = row[yKey];
      if (yType === "number") {
        const num = Number(val);
        if (!isNaN(num)) {
          grouped[key].sum += num;
          grouped[key].values.push(num);
        }
      }
      grouped[key].count++;
    });

    return Object.entries(grouped).map(([name, m]) => {
      let value = 0;
      if (aggregation === "count") value = m.count;
      if (aggregation === "sum") value = m.sum;
      if (aggregation === "avg") {
        value = m.values.length ? m.values.reduce((a, b) => a + b, 0) / m.values.length : 0;
      }
      return { name, value };
    }).slice(0, 15); // Limitamos para mejor visualización
  };

  // ================= MEMOS =================
  const cols = useMemo(() => Object.keys(data[0] || {}), [data]);

  const filteredData = useMemo(() => {
    if (!filterColumn || !filterValue) return data;
    return data.filter(row =>
      String(row[filterColumn]).toLowerCase().includes(filterValue.toLowerCase())
    );
  }, [data, filterColumn, filterValue]);

  const columnGroups = useMemo(() => {
    const numeric = [];
    const categorical = [];
    const date = [];
    cols.forEach(c => {
      const t = getColumnType(c, data);
      if (t === "number") numeric.push(c);
      else if (t === "date") date.push(c);
      else categorical.push(c);
    });
    return { numeric, categorical, date };
  }, [data, cols]);

  const insights = useMemo(() => {
    if (!data.length) return [];
    const res = [];
    cols.forEach(col => {
      const type = getColumnType(col, data);
      if (type === "number") {
        const vals = data.map(d => Number(d[col])).filter(v => !isNaN(v));
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        res.push({ label: col, details: avg.toFixed(2), type: 'number' });
      }
      if (type === "string") {
        const freq = {};
        data.forEach(r => freq[r[col]] = (freq[r[col]] || 0) + 1);
        const top = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
        if (top) res.push({ label: col, details: top[0], type: 'string' });
      }
    });
    return res;
  }, [data, cols]);

  // ================= ACCIONES =================
  const addChart = () => {
    setChartsConfig(prev => [
      ...prev,
      { id: Date.now(), type: "bar", x: cols[0], y: cols[0], aggregation: "count" }
    ]);
  };

  const updateChart = (id, field, value) => {
    setChartsConfig(prev =>
      prev.map(c => c.id === id ? { ...c, [field]: value } : c)
    );
  };

  const removeChart = (id) => {
    setChartsConfig(prev => prev.filter(c => c.id !== id));
  };

  const renderChart = (chart) => {
    const chartData = buildGroupedData(filteredData, chart.x, chart.y, chart.aggregation);
    if (!chartData.length) {
      return <div className="graficos-loading"><Info size={24} /> No hay datos suficientes</div>;
    }

    return (
      <div className="chart-render-area">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end" 
              interval={0} 
              height={60}
              tick={{ fontSize: 12, fill: '#666' }}
            />
            <YAxis tick={{ fontSize: 12, fill: '#666' }} />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // ================= EFFECT: LOAD DATA =================
  useEffect(() => {
    const load = async () => {
      try {
        const dataset = await getPublicDatasetById(id);
        setDatasetMeta(dataset);

        if (!dataset.files || dataset.files.length === 0) {
          throw new Error("No hay archivos");
        }

        // ✅ seleccionar archivo correcto
        const selectedFile = dataset.files.find(
          f => String(f.aws_file_reference_id) === String(fileId)
        );

        const file = selectedFile || dataset.files[0];

        const res = await fetch(file.file_url);
        const url = file.file_url.toLowerCase();

        if (url.includes(".xlsx")) {
          const buffer = await res.arrayBuffer();
          const wb = XLSX.read(buffer, { type: "array" });

          const sheetsArr = wb.SheetNames;
          const all = {};

          sheetsArr.forEach(s => {
            all[s] = XLSX.utils.sheet_to_json(wb.Sheets[s], { defval: "" });
          });

          setSheets(sheetsArr);
          setWorkbookData(all);
          setSelectedSheet(sheetsArr[0]);
          processRows(all[sheetsArr[0]]);
        } else if (url.includes(".json")) {
            const json = await res.json();
            processJSON(json);
          }    
         else {
          const text = await res.text();
          const delimiter = detectDelimiter(text);

          Papa.parse(text, {
            header: true,
            delimiter,
            skipEmptyLines: true,
            complete: (r) => processRows(r.data)
          });
        }

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, fileId]); // 👈 importante agregar fileId

  if (loading) {
    return (
      <div className="graficos-loading">
        <Loader2 size={48} className="spinner-icon" />
        <p>Analizando fuentes de datos...</p>
      </div>
    );
  }

  return (
    <div className="graficos-layout">
      
      {/* SIDEBAR */}
      <aside className="sidebar-left">
        
        {/* Card Informativa del Dataset */}
        <div className="dg-card dataset-info-card">
          <div className="info-title">
            <Database size={24} />
            {datasetMeta?.title || "Explorador de Datos"}
          </div>
          <div className="info-meta">
            <span className="info-institution">
              <Activity size={14} />
              {datasetMeta?.institucion || "Institución"}
            </span>
          </div>
          <div className="info-desc">
            <Info size={18} />
            <p>{datasetMeta?.description || "Análisis dinámico de variables."}</p>
          </div>
        </div>

        {/* Card de Filtros */}
        <div className="dg-card">
          <div className="card-header">
            <Filter size={18} /> Filtro de registros
          </div>
          <div className="filter-group">
            <label>Columna</label>
            <select 
              className="dg-select"
              value={filterColumn}
              onChange={(e) => setFilterColumn(e.target.value)}
            >
              <option value="">Seleccionar...</option>
              {cols.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>Valor a buscar</label>
            <input 
              type="text" 
              className="dg-input"
              placeholder="Escribe para filtrar..."
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              disabled={!filterColumn}
            />
          </div>
        </div>

        {/* Estructura de Datos */}
        <div className="dg-card">
          <div className="card-header">
            <Layers size={18} /> Columnas detectadas
          </div>
          <div className="structure-list">
            {cols.map(c => (
              <div key={c} className="mapping-row">
                <span className="col-name">{c}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Insights Inteligentes */}
        <div className="dg-card">
          <div className="card-header">
            <Activity size={18} /> Resumen Automático
          </div>
          <div className="insights-list" style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            {insights.slice(0, 5).map((i, idx) => (
              <div key={idx} className="insight-item">
                <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: '#666', fontSize: '0.8rem', fontWeight: '600'}}>
                  {i.type === 'number' ? <BarChart2 size={14} /> : <Tag size={14} />}
                  {i.label.toUpperCase()}
                </div>
                <div style={{fontSize: '1rem', fontWeight: '700', color: '#1976d2', marginTop: '2px'}}>
                  {i.type === 'number' ? `Prom: ${i.details}` : i.details}
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        
        <div className="dg-card chart-header-card">
          <div>
            <h1 className="main-title">
              <BarChart2 size={28} color="#1976d2" /> Dashboard Interactivo
            </h1>
            <p className="main-subtitle">Total de registros cargados: <strong>{filteredData.length}</strong></p>
          </div>
          <button className="btn-primary" onClick={addChart}>
            <Plus size={20} /> Nuevo Gráfico
          </button>
        </div>

        {/* Selector de Hojas (si es Excel) */}
        {sheets.length > 1 && (
          <div className="dg-card" style={{display: 'flex', gap: '10px', overflowX: 'auto', padding: '10px'}}>
             {sheets.map(s => (
               <button 
                key={s}
                className={selectedSheet === s ? "btn-primary" : "dg-select-sm"}
                onClick={() => {
                  setSelectedSheet(s);
                  processRows(workbookData[s]);
                }}
               >
                 {s}
               </button>
             ))}
          </div>
        )}

        {/* Renderizado de Gráficos */}
        <div className="charts-container">
          {chartsConfig.map(chart => (
            <div key={chart.id} className="dg-card chart-box">
              <div className="chart-toolbar">
                <div className="toolbar-controls">
                  <div className="control-item">
                    <label>Eje X</label>
                    <select 
                      className="dg-select-sm"
                      value={chart.x}
                      onChange={(e) => updateChart(chart.id, "x", e.target.value)}
                    >
                      {columnGroups.categorical.map(c => <option key={c}>{c}</option>)}
                      {columnGroups.date.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="control-item">
                    <label>Eje Y (Valores)</label>
                    <select 
                      className="dg-select-sm"
                      value={chart.y}
                      onChange={(e) => updateChart(chart.id, "y", e.target.value)}
                    >
                      {columnGroups.numeric.map(c => <option key={c}>{c}</option>)}
                      <option value={chart.x}>Frecuencia (Count)</option>
                    </select>
                  </div>

                  <div className="control-item">
                    <label>Operación</label>
                    <select 
                      className="dg-select-sm"
                      value={chart.aggregation}
                      onChange={(e) => updateChart(chart.id, "aggregation", e.target.value)}
                    >
                      <option value="count">Contar registros</option>
                      <option value="sum">Sumar valores</option>
                      <option value="avg">Promedio</option>
                    </select>
                  </div>
                </div>

                <button className="btn-danger-icon" onClick={() => removeChart(chart.id)} title="Eliminar gráfico">
                  <Trash2 size={18} />
                </button>
              </div>

              {renderChart(chart)}
            </div>
          ))}
        </div>

        {/* Tabla de Datos Crudos */}
        <div className="dg-card">
          <div className="card-header">
            <TableIcon size={18} /> Vista previa de los datos
          </div>
          <div className="table-responsive">
            <table className="dg-table">
              <thead>
                <tr>
                  {cols.map(c => <th key={c}>{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {filteredData.slice(0, 10).map((row, idx) => (
                  <tr key={idx}>
                    {cols.map(c => <td key={c} title={String(row[c])}>{String(row[c])}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}

export default DatasetGraficos;