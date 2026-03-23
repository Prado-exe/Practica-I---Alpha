import { useNavigate } from "react-router-dom";
import {
  PieChart, Pie, Cell, Tooltip, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend
} from "recharts";

import "../../Styles/Pages_styles/Admin/Dashboard.css";
import CanView from "../../Components/Common/CanView";

function Dashboard() {
  const navigate = useNavigate();

  const stats = {
    total: 120,
    publicados: 80,
    validacion: 25,
    usuarios: 45
  };

  const categoriasData = [
    { name: "Tecnología", value: 40 },
    { name: "Economía", value: 25 },
    { name: "Salud", value: 20 },
    { name: "Educación", value: 15 }
  ];

  const estadoData = [
    { name: "Publicados", value: 80 },
    { name: "Validación", value: 25 },
    { name: "Rechazados", value: 15 }
  ];

  const COLORS = ["#4CAF50", "#FFC107", "#2196F3", "#F44336"];

  return (
    <div className="dashboard">

      {/* HEADER */}
      <div className="dashboard-header">
        <h1>Panel de Administración</h1>
        <p>Resumen general del sistema</p>
      </div>

      {/* CARDS */}
      <div className="dashboard-cards">
        <div className="card highlight">
          <div className="card-top">
            <h3>Datasets</h3>
            <span>📊</span>
          </div>
          <p className="number">{stats.total}</p>
          <span className="trend up">+12% este mes</span>
        </div>

        <div className="card success">
          <div className="card-top">
            <h3>Publicados</h3>
            <span>✅</span>
          </div>
          <p className="number">{stats.publicados}</p>
          <span className="trend up">+8%</span>
        </div>

        <div className="card warning">
          <div className="card-top">
            <h3>Validación</h3>
            <span>⏳</span>
          </div>
          <p className="number">{stats.validacion}</p>
          <span className="trend down">-3%</span>
        </div>

        <div className="card info">
          <div className="card-top">
            <h3>Usuarios</h3>
            <span>👤</span>
          </div>
          <p className="number">{stats.usuarios}</p>
          <span className="trend up">+5%</span>
        </div>
      </div>

      {/* ACTIVIDAD */}
      <div className="dashboard-section">
        <div className="section-title">
          <div className="title-indicator"></div>
          <h2>Actividad reciente</h2>
        </div>

        <div className="section-header">
          {/* 👇 Exigimos permiso para leer el historial de actividad */}
          <CanView requiredPermission="activity_log.read">
            <button onClick={() => navigate("/administracion/actividad")}>
              Ver todo
            </button>
          </CanView>
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
              {/* 6 filas */}
              <tr>
                <td>18-03-2026 10:30</td>
                <td>Juan</td>
                <td><span className="badge admin">Admin</span></td>
                <td>Creó dataset</td>
                <td><span className="badge success">Exitoso</span></td>
              </tr>
              <tr>
                <td>18-03-2026 09:15</td>
                <td>Ana</td>
                <td><span className="badge validator">Validador</span></td>
                <td>Validó dataset</td>
                <td><span className="badge success">Aprobado</span></td>
              </tr>
              <tr>
                <td>17-03-2026 18:20</td>
                <td>Carlos</td>
                <td><span className="badge admin">Admin</span></td>
                <td>Eliminó dataset</td>
                <td><span className="badge error">Fallido</span></td>
              </tr>
              <tr>
                <td>17-03-2026 16:40</td>
                <td>María</td>
                <td><span className="badge validator">Validador</span></td>
                <td>Rechazó dataset</td>
                <td><span className="badge warning">Rechazado</span></td>
              </tr>
              <tr>
                <td>16-03-2026 12:10</td>
                <td>Pedro</td>
                <td><span className="badge admin">Admin</span></td>
                <td>Actualizó dataset</td>
                <td><span className="badge success">Exitoso</span></td>
              </tr>
              <tr>
                <td>16-03-2026 09:00</td>
                <td>Sofía</td>
                <td><span className="badge validator">Validador</span></td>
                <td>Validó dataset</td>
                <td><span className="badge success">Aprobado</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* VALIDACIONES */}
      <div className="dashboard-section">
        <div className="section-title">
          <div className="title-indicator"></div>
          <h2>Validaciones pendientes</h2>
        </div>

        <div className="section-header">
          {/* 👇 Exigimos permiso de ejecución de validación */}
          <CanView requiredPermission="data_validation.execute">
            <button onClick={() => navigate("/administracion/validaciones")}>
              Revisar
            </button>
          </CanView>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Dataset</th>
                <th>Institución</th>
                <th>Fecha</th>
                <th>Cambios</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Economía 2026</td>
                <td>Ministerio de Economía</td>
                <td>18-03-2026</td>
                <td>Actualización anual</td>
              </tr>
              <tr>
                <td>Salud Pública</td>
                <td>Ministerio de Salud</td>
                <td>17-03-2026</td>
                <td>Nuevos indicadores</td>
              </tr>
              <tr>
                <td>Educación Escolar</td>
                <td>MINEDUC</td>
                <td>16-03-2026</td>
                <td>Corrección de datos</td>
              </tr>
              <tr>
                <td>Transporte Urbano</td>
                <td>Ministerio de Transporte</td>
                <td>15-03-2026</td>
                <td>Datos 2025 agregados</td>
              </tr>
              <tr>
                <td>Vivienda Social</td>
                <td>MINVU</td>
                <td>14-03-2026</td>
                <td>Actualización regional</td>
              </tr>
              <tr>
                <td>Seguridad Ciudadana</td>
                <td>Ministerio del Interior</td>
                <td>13-03-2026</td>
                <td>Revisión de estadísticas</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ÚLTIMOS DATASETS */}
      <div className="dashboard-section">
        <div className="section-title">
          <div className="title-indicator"></div>
          <h2>Últimos datasets</h2>
        </div>

        <div className="section-header">
          {/* 👇 Exigimos permiso para leer datasets */}
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
              <tr>
                <td>Dataset Tecnología</td>
                <td>Ministerio de Ciencia</td>
                <td>18-03-2026</td>
                <td><span className="badge success">Publicado</span></td>
              </tr>
              <tr>
                <td>Educación Chile</td>
                <td>MINEDUC</td>
                <td>17-03-2026</td>
                <td><span className="badge warning">En validación</span></td>
              </tr>
              <tr>
                <td>Salud Nacional</td>
                <td>Ministerio de Salud</td>
                <td>16-03-2026</td>
                <td><span className="badge success">Publicado</span></td>
              </tr>
              <tr>
                <td>Economía Regional</td>
                <td>Ministerio de Economía</td>
                <td>15-03-2026</td>
                <td><span className="badge error">Rechazado</span></td>
              </tr>
              <tr>
                <td>Transporte Urbano</td>
                <td>Ministerio de Transporte</td>
                <td>14-03-2026</td>
                <td><span className="badge success">Publicado</span></td>
              </tr>
              <tr>
                <td>Vivienda Social</td>
                <td>MINVU</td>
                <td>13-03-2026</td>
                <td><span className="badge warning">En validación</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* GRÁFICOS */}
      <div className="dashboard-section">
        <h2>Indicadores</h2>

        <div className="charts">
          <div className="chart-card">
            <h3>Categorías</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={categoriasData} dataKey="value" outerRadius={80}>
                  {categoriasData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "10px" }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h3>Estados</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={estadoData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip contentStyle={{ borderRadius: "10px" }} />
                <Legend />
                <Bar dataKey="value" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
}

export default Dashboard;