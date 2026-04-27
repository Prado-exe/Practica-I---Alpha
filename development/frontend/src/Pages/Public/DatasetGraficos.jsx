import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import Papa from "papaparse";

import {
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

import {
  BarChart2, Filter, Layers, Plus, Trash2,
  Table as TableIcon, Database, Activity,
  Loader2, Building2, AlignLeft
} from "lucide-react";

import { getPublicDatasetById } from "../../Services/DatasetService";
import "../../Styles/Pages_styles/Public/DatasetGraficos.css";

const COLORS = ["#0056b3","#1976d2","#1b7a4a","#388e3c","#6a1b9a","#c62828","#ef6c00", "#00838f"];

function DatasetGraficos() {
  const { id } = useParams();

  const [datasetMeta, setDatasetMeta] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterColumn, setFilterColumn] = useState("");
  const [filterValue, setFilterValue] = useState("");

  const [chartsConfig, setChartsConfig] = useState([]);

  // -----------------------------
  const clean = (v) => {
    if (typeof v === "number") return v;
    if (!v) return 0;
    return Number(String(v).replace(/[^0-9.-]/g, "")) || 0;
  };

  const cols = Object.keys(data[0] || {});

  // -----------------------------
  const isNumericColumn = (col, sampleData) => {
    const sample = sampleData.slice(0, 20);
    const numericCount = sample.filter(r => {
      const v = r[col];
      return v !== null && v !== "" && !isNaN(Number(v));
    }).length;

    return numericCount > sample.length * 0.7;
  };

  // -----------------------------
  const filteredData = useMemo(() => {
    if (!filterColumn || !filterValue) return data;

    return data.filter(row =>
      String(row[filterColumn])
        .toLowerCase()
        .includes(filterValue.toLowerCase())
    );
  }, [data, filterColumn, filterValue]);

  // -----------------------------
  const buildGroupedData = (data, xKey, yKey, aggregation = "sum") => {
    const grouped = {};

    const yIsNumeric = isNumericColumn(yKey, data);

    data.forEach(row => {
      const key = row[xKey] ?? "N/A";

      if (!grouped[key]) {
        grouped[key] = { sum: 0, count: 0, values: [] };
      }

      const rawValue = row[yKey];

      if (yIsNumeric) {
        const value = Number(rawValue);
        if (!isNaN(value)) {
          grouped[key].sum += value;
          grouped[key].values.push(value);
        }
      }

      grouped[key].count += 1;
    });

    return Object.entries(grouped).map(([name, metrics]) => {
      let value = 0;

      if (aggregation === "count") {
        value = metrics.count;
      }

      if (aggregation === "sum") {
        value = metrics.sum;
      }

      if (aggregation === "avg") {
        value = metrics.values.length
          ? metrics.values.reduce((a, b) => a + b, 0) / metrics.values.length
          : 0;
      }

      return { name, value };
    });
  };

  // -----------------------------
  const addChart = () => {
    setChartsConfig(prev => [
      ...prev,
      {
        id: Date.now(),
        type: "bar",
        x: cols[0],
        y: cols[1] || cols[0],
        aggregation: "count"
      }
    ]);
  };

  const updateChart = (id, field, value) => {
    setChartsConfig(prev =>
      prev.map(c =>
        c.id === id ? { ...c, [field]: value } : c
      )
    );
  };

  const removeChart = (id) => {
    setChartsConfig(prev => prev.filter(c => c.id !== id));
  };

  // -----------------------------
  const renderChart = (chart) => {
    const chartData = buildGroupedData(
      filteredData,
      chart.x,
      chart.y,
      chart.aggregation || "sum"
    );

    if (chart.type === "bar") {
      return (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#1976d2" />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (chart.type === "line") {
      return (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#1976d2" />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (chart.type === "pie") {
      return (
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label>
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    return null;
  };

  // -----------------------------
  useEffect(() => {
    const load = async () => {
      try {
        const dataset = await getPublicDatasetById(id);
        setDatasetMeta(dataset);

        const file = dataset.files?.[0];
        const res = await fetch(file.file_url);
        const text = await res.text();

        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
          complete: (result) => {
            const rows = result.data;
            setData(rows);

            setChartsConfig([
              {
                id: Date.now(),
                type: "bar",
                x: Object.keys(rows[0])[0],
                y: Object.keys(rows[0])[1] || Object.keys(rows[0])[0],
                aggregation: "count"
              }
            ]);

            setLoading(false);
          }
        });

      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    if (id) load();
  }, [id]);

  // -----------------------------
  if (loading) {
    return (
      <div className="graficos-loading">
        <Loader2 className="spinner-icon" size={48} />
        <p>Cargando dataset...</p>
      </div>
    );
  }

  // =============================
  return (
  <div className="graficos-layout">

    {/* ================= SIDEBAR ================= */}
    <aside className="sidebar-left">

      {/* INFO DATASET */}
      <div className="dg-card dataset-info-card">
        <h2 className="info-title">
          <Database size={20} />
          {datasetMeta?.title}
        </h2>

        <div className="info-meta">
          <span className="info-institution">
            <Building2 size={16} />
            {datasetMeta?.institution_name}
          </span>
        </div>

        <p className="info-desc">
          <AlignLeft size={16} />
          {datasetMeta?.description}
        </p>
      </div>

      {/* FILTROS */}
      <div className="dg-card">
        <h3 className="card-header">
          <Filter size={18} />
          Filtros de Datos
        </h3>

        <div className="filter-group">
          <label>Filtrar por columna</label>
          <select
            className="dg-select"
            onChange={(e) => setFilterColumn(e.target.value)}
            value={filterColumn}
          >
            <option value="">Seleccionar columna...</option>
            {cols.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Contiene el valor</label>
          <input
            className="dg-input"
            placeholder="Ej: Chile, Action, Male..."
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            disabled={!filterColumn}
          />
        </div>
      </div>

      {/* ESTRUCTURA */}
      <div className="dg-card">
        <h3 className="card-header">
          <Layers size={18} />
          Estructura del Dataset
        </h3>

        <div className="structure-list">
          {cols.map(c => (
            <div key={c} className="mapping-row">
              <span className="col-name">{c}</span>
            </div>
          ))}
        </div>
      </div>

    </aside>

    {/* ================= MAIN ================= */}
    <main className="main-content">

      {/* HEADER */}
      <div className="dg-card chart-header-card">
        <div>
          <h3 className="main-title">
            <Activity size={22} />
            Panel de Análisis Visual
          </h3>
          <p className="main-subtitle">
            Explora relaciones entre variables y genera gráficos dinámicos.
          </p>
        </div>

        <button className="btn-primary" onClick={addChart}>
          <Plus size={18} />
          Nuevo gráfico
        </button>
      </div>

      {/* CHARTS */}
      <div className="charts-container">

        {chartsConfig.map(chart => (
          <div key={chart.id} className="dg-card chart-box">

            {/* TOOLBAR */}
            <div className="chart-toolbar">

              <div className="toolbar-controls">

                <div className="control-item">
                  <label>Tipo</label>
                  <select
                    className="dg-select-sm"
                    value={chart.type}
                    onChange={(e) => updateChart(chart.id, "type", e.target.value)}
                  >
                    <option value="bar">Barras</option>
                    <option value="line">Líneas</option>
                  </select>
                </div>

                <div className="control-item">
                  <label>Eje X</label>
                  <select
                    className="dg-select-sm"
                    value={chart.x}
                    onChange={(e) => updateChart(chart.id, "x", e.target.value)}
                  >
                    {cols.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="control-item">
                  <label>Eje Y</label>
                  <select
                    className="dg-select-sm"
                    value={chart.y}
                    onChange={(e) => updateChart(chart.id, "y", e.target.value)}
                  >
                    {cols.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="control-item">
                  <label>Operación</label>
                  <select
                    className="dg-select-sm"
                    value={chart.aggregation || "count"}
                    onChange={(e) => updateChart(chart.id, "aggregation", e.target.value)}
                  >
                    <option value="count">Contar</option>
                    <option value="sum">Sumar</option>
                    <option value="avg">Promedio</option>
                  </select>
                </div>

              </div>

              <button
                className="btn-danger-icon"
                onClick={() => removeChart(chart.id)}
                title="Eliminar gráfico"
              >
                <Trash2 size={18} />
              </button>

            </div>

            {/* GRAFICO */}
            <div className="chart-render-area">
              {renderChart(chart)}
            </div>

          </div>
        ))}

      </div>

      {/* TABLA */}
      <div className="dg-card preview-card">

        <h3 className="card-header">
          <TableIcon size={18} />
          Vista previa de datos
        </h3>

        <div className="table-responsive">
          <table className="dg-table">

            <thead>
              <tr>
                {cols.map(c => (
                  <th key={c}>{c}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredData.slice(0, 10).map((row, i) => (
                <tr key={i}>
                  {cols.map(c => (
                    <td key={c} title={row[c]}>
                      {row[c]}
                    </td>
                  ))}
                </tr>
              ))}

              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={cols.length} className="empty-table">
                    No hay datos que coincidan con los filtros.
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>

      </div>

    </main>
  </div>
);
}

export default DatasetGraficos;