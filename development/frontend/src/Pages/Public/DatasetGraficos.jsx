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

import { getPublicDatasetById } from "../../Services/DatasetService";
import "../../Styles/Pages_styles/Public/DatasetGraficos.css";

const COLORS = ["#0056b3","#1976d2","#1b7a4a","#388e3c","#6a1b9a","#c62828","#ef6c00"];

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
    return Number(String(v).replace(/[^0-9.-]/g, "")) || 0;
  };

  // -----------------------------
  const cols = Object.keys(data[0] || {});

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
  const buildGroupedData = (data, xKey, yKey) => {
    const grouped = {};

    data.forEach(row => {
      const key = row[xKey] ?? "N/A";
      const value = clean(row[yKey]);

      grouped[key] = (grouped[key] || 0) + value;
    });

    return Object.entries(grouped).map(([name, value]) => ({
      name,
      value
    }));
  };

  // -----------------------------
  const addChart = () => {
    setChartsConfig(prev => [
      ...prev,
      {
        id: Date.now(),
        type: "bar",
        x: cols[0],
        y: cols[1]
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
    const chartData = buildGroupedData(filteredData, chart.x, chart.y);

    if (chart.type === "bar") {
      return (
        <ResponsiveContainer width="100%" height={280}>
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
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line dataKey="value" stroke="#1976d2" />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (chart.type === "pie") {
      return (
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={90}>
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
          complete: (result) => {
            const rows = result.data;

            setData(rows);

            setChartsConfig([
              {
                id: Date.now(),
                type: "bar",
                x: Object.keys(rows[0])[0],
                y: Object.keys(rows[0])[1]
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

    load();
  }, [id]);

  // -----------------------------
  if (loading) return <p>Cargando...</p>;

  // =============================
  return (
    <div className="graficos-layout">

      {/* ================= SIDEBAR ================= */}
      <aside className="sidebar-left">

        <div className="dataset-info-card">
          <h2>{datasetMeta?.title}</h2>
          <p>🏛️ {datasetMeta?.institution_name}</p>
          <p>{datasetMeta?.description}</p>
        </div>

        <div className="chart-card">
          <h3>🔎 Filtros</h3>

          <select onChange={(e) => setFilterColumn(e.target.value)}>
            <option value="">Columna</option>
            {cols.map(c => <option key={c}>{c}</option>)}
          </select>

          <input
            placeholder="Valor"
            onChange={(e) => setFilterValue(e.target.value)}
          />
        </div>

        <div className="chart-card">
          <h3>🧱 Estructura</h3>
          {cols.map(c => (
            <div key={c} className="mapping-row">
              <span>{c}</span>
            </div>
          ))}
        </div>

      </aside>

      {/* ================= MAIN ================= */}
      <main className="main-content">

        {/* HEADER */}
        <div className="chart-card chart-header">
          <h3>📊 Gráficos múltiples</h3>
          <button className="btn-add" onClick={addChart}>
            + Agregar gráfico
          </button>
        </div>

        {/* CHARTS */}
        {chartsConfig.map(chart => (
          <div key={chart.id} className="chart-box">

            <div className="chart-controls">

              <select
                value={chart.type}
                onChange={(e) => updateChart(chart.id, "type", e.target.value)}
              >
                <option value="bar">Bar</option>
                <option value="line">Line</option>
                <option value="pie">Pie</option>
              </select>

              <select
                value={chart.x}
                onChange={(e) => updateChart(chart.id, "x", e.target.value)}
              >
                {cols.map(c => <option key={c}>{c}</option>)}
              </select>

              <select
                value={chart.y}
                onChange={(e) => updateChart(chart.id, "y", e.target.value)}
              >
                {cols.map(c => <option key={c}>{c}</option>)}
              </select>

              <button onClick={() => removeChart(chart.id)}>
                ✖
              </button>

            </div>

            {renderChart(chart)}

          </div>
        ))}

        {/* PREVIEW */}
        <div className="chart-card">
          <h3>👀 Vista previa</h3>

          <table className="preview-table">
            <thead>
              <tr>
                {cols.map(c => <th key={c}>{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {filteredData.slice(0, 10).map((row, i) => (
                <tr key={i}>
                  {cols.map(c => (
                    <td key={c}>{row[c]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

        </div>

      </main>
    </div>
  );
}

export default DatasetGraficos;