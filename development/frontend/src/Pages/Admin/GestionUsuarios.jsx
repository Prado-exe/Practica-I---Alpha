import { useState, useEffect, useMemo } from "react";
import SearchBarAdvanced from "../../Components/Common/SearchBarAdvanced";
import Pagination from "../../Components/Common/Pagination";
import CanView from "../../Components/Common/CanView";
import { useAuth } from "../../Context/AuthContext"; // 👇 Importamos el contexto
import "../../Styles/Pages_styles/Admin/GestionUsuarios.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function GestionUsuarios() {
  const { user, loading: authLoading } = useAuth();  
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState("");
  const [rolFiltro, setRolFiltro] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const usuariosPorPagina = 5;

  const fetchUsuarios = async () => {
    if (!user || !user.token || user.token === "undefined") {
      console.error("Intento de petición bloqueado: Token inexistente o es 'undefined'");
      
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/usuarios`, {
        headers: {
          "Authorization": `Bearer ${user.token}`, 
          "Content-Type": "application/json"
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsuarios(data.usuarios || []); 
      } else if (response.status === 401) {
        console.error("Sesión expirada o no autorizada");
      }
    } catch (error) {
      console.error("Error de conexión:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchUsuarios();
    }
  }, [authLoading, user?.token]);

  // 🔍 Filtrado local
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter(u => {
      // Ajusta 'u.full_name' o 'u.nombre' según lo que devuelva tu base de datos
      const nombreUsuario = u.full_name || u.nombre || "";
      const rolUsuario = u.rol || u.role_code || "";
      
      return (
        nombreUsuario.toLowerCase().includes(search.toLowerCase()) &&
        (rolFiltro ? rolUsuario === rolFiltro : true) &&
        (estadoFiltro ? u.estado === estadoFiltro : true)
      );
    });
  }, [usuarios, search, rolFiltro, estadoFiltro]);

  const totalPaginas = Math.ceil(usuariosFiltrados.length / usuariosPorPagina) || 1;
  const usuariosActuales = usuariosFiltrados.slice(
    (currentPage - 1) * usuariosPorPagina,
    currentPage * usuariosPorPagina
  );

  // ❌ 2. Eliminar usuario en el Backend
  const handleEliminar = async (id) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este usuario?")) return;

    try {
      const response = await fetch(`${API_URL}/api/usuarios/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${user.token}`
        }
      });

      if (response.ok) {
        setUsuarios(usuarios.filter(u => (u.account_id || u.id) !== id));
      } else {
        alert("Error al eliminar el usuario");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // 🔄 3. Cambiar estado en el Backend (Activar/Desactivar)
  const toggleEstado = async (id, estadoActual) => {
    const nuevoEstado = estadoActual === "active" ? "inactive" : "active";
    
    try {
      const response = await fetch(`${API_URL}/api/usuarios/${id}/estado`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`
        },
        body: JSON.stringify({ estado: nuevoEstado })
      });

      if (response.ok) {
        setUsuarios(usuarios.map(u =>
          (u.account_id || u.id) === id ? { ...u, estado: nuevoEstado } : u
        ));
      } else {
        alert("Error al cambiar el estado");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="gestion-usuarios">
      <header className="usuarios-header">
        <h1>Gestión de Usuarios</h1>
        <p>{usuariosFiltrados.length} usuarios encontrados</p>
      </header>

      {/* 🔎 FILTROS */}
      <div className="usuarios-filtros">
        <SearchBarAdvanced
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre..."
        />
        <select onChange={(e) => setRolFiltro(e.target.value)}>
          <option value="">Todos los roles</option>
          <option value="super_admin">Super Admin</option>
          <option value="user_admin">Admin de Usuarios</option>
          <option value="data_admin">Admin de Datos</option>
          <option value="registered_user">Usuario Registrado</option>
        </select>

        <select onChange={(e) => setEstadoFiltro(e.target.value)}>
          <option value="">Todos</option>
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
          <option value="pending_verification">Pendiente</option>
        </select>

        <button onClick={() => {
          setSearch("");
          setRolFiltro("");
          setEstadoFiltro("");
        }}>
          Limpiar
        </button>
      </div>

      {/* 📋 TABLA */}
      {loading ? (
        <p>Cargando usuarios...</p>
      ) : (
        <table className="usuarios-tabla">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuariosActuales.map(u => {
              const id = u.account_id || u.id;
              const estado = u.estado || u.account_status;
              return (
                <tr key={id}>
                  <td>{u.full_name || u.nombre}</td>
                  <td>{u.email}</td>
                  <td>{(u.rol || u.role_code || "").replace("_", " ")}</td>
                  <td>
                    <span className={`estado ${estado}`}>
                      {estado}
                    </span>
                  </td>
                  <td className="acciones">
                    <CanView requiredPermission="user_management.write">
                      <button onClick={() => toggleEstado(id, estado)}>
                        {estado === "active" ? "Desactivar" : "Activar"}
                      </button>
                      <button className="editar">Editar</button>
                    </CanView>

                    <CanView requiredPermission="user_management.delete">
                      <button className="eliminar" onClick={() => handleEliminar(id)}>
                        Eliminar
                      </button>
                    </CanView>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* 📄 PAGINACIÓN */}
      {!loading && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPaginas}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}

export default GestionUsuarios;