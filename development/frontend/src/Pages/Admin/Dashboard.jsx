import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  PieChart, Pie, Cell, Tooltip,
  ResponsiveContainer, Legend
} from "recharts";

import "../../Styles/Pages_styles/Admin/Dashboard.css";
import CanView from "../../Components/Common/CanView";
import { useAuth } from "../../Context/AuthContext";
import { getDashboardStats } from "../../Services/DashboardService";

/* ── mapeos de display ── */
const STATUS_LABELS = {
  published:          "Publicado",
  pending_validation: "En validación",
  rejected:           "Rechazado",
  draft:              "Borrador",
  deleted:            "Eliminado",
};

const STATUS_BADGE = {
  published:          "success",
  pending_validation: "warning",
  rejected:           "error",
  draft:              "neutral",
};

const EVENT_LABELS = {
  created:                    "Creó dataset",
  edited:                     "Editó dataset",
  published:                  "Publicó dataset",
  rejected:                   "Rechazó dataset",
  deleted:                    "Eliminó dataset",
  submitted_for_validation:   "Envió a validación",
};

const RESULT_BADGE = {
  success: "success",
};

const CHART_COLORS = ["#4CAF50", "#FFC107", "#2196F3", "#F44336", "#9C27B0", "#FF5722", "#00BCD4", "#795548"];

/* ── estado vacío inicial ── */
const EMPTY = {
  stats:              { total: 0, publicados: 0, validacion: 0, usuarios: 0 },
  byCategory:         [],
  byStatus:           [],
  latestDatasets:     [],
  pendingValidations: [],
  recentActivity:     [],
};

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [dashData, setDashData] = useState(EMPTY);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    if (!user?.token) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const data = await getDashboardStats(user.token);
        if (!cancelled) setDashData(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user?.token]);

  const { stats, byCategory, byStatus, latestDatasets, pendingValidations, recentActivity } = dashData;

  /* byStatus con labels legibles para el gráfico */
  const barData = byStatus.map(s => ({ ...s, name: STATUS_LABELS[s.name] ?? s.name }));

  return (
    <div className="dashboard">

      <div className="dashboard-header">
        <h1>Panel de Administración</h1>
        <p>Resumen general del sistema</p>
      </div>

      {error && (
        <div className="dash-error">
          No se pudo cargar el dashboard: {error}
        </div>
      )}

      {/* CARDS */}
      <div className="dashboard-cards">
        <div className="card highlight">
          <div className="card-top"><h3>Datasets</h3><span>📊</span></div>
          <p className="number">{loading ? "—" : stats.total.toLocaleString("es-CL")}</p>
          <span className="trend neutral">total en el sistema</span>
        </div>

        <div className="card success">
          <div className="card-top"><h3>Publicados</h3><span>✅</span></div>
          <p className="number">{loading ? "—" : stats.publicados.toLocaleString("es-CL")}</p>
          <span className="trend up">datasets activos</span>
        </div>

        <div className="card warning">
          <div className="card-top"><h3>Validación</h3><span>⏳</span></div>
          <p className="number">{loading ? "—" : stats.validacion.toLocaleString("es-CL")}</p>
          <span className="trend neutral">pendientes de revisión</span>
        </div>

        <div className="card info">
          <div className="card-top"><h3>Usuarios</h3><span>👤</span></div>
          <p className="number">{loading ? "—" : stats.usuarios.toLocaleString("es-CL")}</p>
          <span className="trend neutral">cuentas registradas</span>
        </div>
      </div>

      {/* ACTIVIDAD RECIENTE */}
      <div className="dashboard-section">
        <div className="section-title">
          <div className="title-indicator"></div>
          <h2>Actividad reciente</h2>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Acción</th>
                <th>Resultado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: "center" }}>Cargando…</td></tr>
              ) : recentActivity.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: "center" }}>Sin actividad registrada</td></tr>
              ) : recentActivity.map((ev, i) => (
                <tr key={i}>
                  <td>{ev.fecha}</td>
                  <td>{ev.usuario}</td>
                  <td><span className={`badge ${ev.rol === "super_admin" ? "admin" : "validator"}`}>{ev.rol}</span></td>
                  <td>{EVENT_LABELS[ev.event_type] ?? ev.event_type}</td>
                  <td><span className={`badge ${RESULT_BADGE[ev.event_result] ?? "neutral"}`}>{ev.event_result === "success" ? "Exitoso" : ev.event_result}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* VALIDACIONES PENDIENTES */}
      <div className="dashboard-section">
        <div className="section-title">
          <div className="title-indicator"></div>
          <h2>Validaciones pendientes</h2>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Dataset</th>
                <th>Institución</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} style={{ textAlign: "center" }}>Cargando…</td></tr>
              ) : pendingValidations.length === 0 ? (
                <tr><td colSpan={3} style={{ textAlign: "center" }}>No hay validaciones pendientes</td></tr>
              ) : pendingValidations.map((ds, i) => (
                <tr key={i}>
                  <td>{ds.title}</td>
                  <td>{ds.institucion}</td>
                  <td>{ds.fecha}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ÚLTIMOS DATASETS */}
      <div className="dashboard-section ultimos-datasets">
        <div className="section-title">
          <div className="title-indicator"></div>
          <h2>Últimos datasets</h2>
        </div>

        <div className="section-header">
          <CanView requiredPermission="data_management.read">
            <button onClick={() => navigate("/administracion/datasets")}>
              Ver todos
            </button>
          </CanView>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Dataset</th>
                <th>Institución</th>
                <th>Fecha creación</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center" }}>
                    Cargando…
                  </td>
                </tr>
              ) : latestDatasets.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center" }}>
                    Sin datasets
                  </td>
                </tr>
              ) : latestDatasets.map((ds, i) => (
                <tr key={i}>
                  {/* 🔥 IMPORTANTE: agregamos title para ver texto completo */}
                  <td title={ds.title}>{ds.title}</td>
                  <td title={ds.institucion}>{ds.institucion}</td>
                  <td>{ds.fecha}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[ds.dataset_status] ?? "neutral"}`}>
                      {STATUS_LABELS[ds.dataset_status] ?? ds.dataset_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* GRÁFICOS */}
      <div className="dashboard-section">
        <h2>Indicadores</h2>
        <div className="charts">
          <div className="chart-card">
            <h3>Por categoría</h3>
            {!loading && byCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={byCategory} dataKey="value" innerRadius={60} outerRadius={90} paddingAngle={3}>
                    {byCategory.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "10px" }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="chart-empty">{loading ? "Cargando…" : "Sin datos"}</p>
            )}
          </div>

          <div className="chart-card">
            <h3>Por estado</h3>
            {!loading && barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={barData}
                    dataKey="value"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {barData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "10px" }} />
                  <Legend formatter={v => <span style={{ fontSize: "0.78rem" }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="chart-empty">{loading ? "Cargando…" : "Sin datos"}</p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

export default Dashboard;
