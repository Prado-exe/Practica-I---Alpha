import { useState, useEffect, useMemo } from "react";
import SearchBarAdvanced from "../../Components/Common/SearchBarAdvanced";
import Pagination from "../../Components/Common/Pagination";
import CanView from "../../Components/Common/CanView";
import { useAuth } from "../../Context/AuthContext"; 
import "../../Styles/Pages_styles/Admin/GestionUsuarios.css";

const API_URL = import.meta.env.VITE_API_URL || "http://3.139.202.192:3000";

function GestionUsuarios() { 
  const { user } = useAuth();
  
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rolesDb, setRolesDb] = useState([]);
  const [search, setSearch] = useState("");
  const [rolFiltro, setRolFiltro] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [modalEditOpen, setModalEditOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({ id: null, full_name: "", email: "", password: "", role_code: "" });

  const usuariosPorPagina = 5;

  const fetchUsuarios = async () => {
    // Tomamos el token de forma segura
    const tokenValido = user?.token || user?.accessToken;
    
    console.log("🚀 [Fetch] Enviando petición a /api/usuarios");
    console.log("🎫 [Fetch] Token utilizado:", tokenValido ? `${tokenValido.substring(0, 15)}...` : "¡ESTÁ VACÍO/UNDEFINED!");

    if (!tokenValido) {
      console.warn("⛔ Petición cancelada: No hay token para enviar.");
      setLoading(false);
      return; 
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/usuarios`, {
        // 👇 Aseguramos el método GET explícito
        method: "GET", 
        headers: {
          "Authorization": `Bearer ${tokenValido}`, 
          "Content-Type": "application/json"
        },
        // 👇 Agregamos credentials para que las cookies viajen si el backend las requiere
        credentials: "include"
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsuarios(data.usuarios || []); 
      } else {
        console.error("❌ Error del Backend. Status:", response.status);
      }
    } catch (error) {
      console.error("Error de conexión HTTP:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    const tokenValido = user?.token || user?.accessToken;
    if (!tokenValido) return;

    try {
      const response = await fetch(`${API_URL}/api/roles`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${tokenValido}` },
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setRolesDb(data.roles || []);
      }
    } catch (error) {
      console.error("Error al obtener roles:", error);
    }
  };
  
  useEffect(() => {
    if (user?.token) {
      fetchUsuarios();
      fetchRoles();
    }
  }, [user?.token]);
  

  // 🔍 Filtrado local y Ocultar Usuario Actual
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter(u => {
      // 1. Evitar que el Super Admin (tú) se vea a sí mismo
      const userId = String(u.account_id || u.id);
      const myId = String(user?.sub || user?.account_id || user?.id);
      if (userId === myId) return false; // Te ocultamos de la lista

      // 2. Extraer datos para buscar
      const nombreUsuario = (u.full_name || u.nombre || "").toLowerCase();
      const emailUsuario = (u.email || "").toLowerCase();
      const terminoBusqueda = search.toLowerCase();
      const rolUsuario = u.rol || u.role_code || "";
      
      // 3. Lógica del buscador (busca por nombre o correo)
      const coincideBusqueda = nombreUsuario.includes(terminoBusqueda) || emailUsuario.includes(terminoBusqueda);
      const coincideRol = rolFiltro ? rolUsuario === rolFiltro : true;
      const coincideEstado = estadoFiltro ? (u.estado || u.account_status) === estadoFiltro : true;

      return coincideBusqueda && coincideRol && coincideEstado;
    });
  }, [usuarios, search, rolFiltro, estadoFiltro, user]);

  const totalPaginas = Math.ceil(usuariosFiltrados.length / usuariosPorPagina) || 1;
  const usuariosActuales = usuariosFiltrados.slice(
    (currentPage - 1) * usuariosPorPagina,
    currentPage * usuariosPorPagina
  );

  // ❌ 2. Eliminar usuario en el Backend
  const handleEliminar = async (id) => {
    if (!window.confirm("⚠️ ADVERTENCIA: ¿Estás absolutamente seguro de que deseas ELIMINAR este usuario de forma permanente?")) return;

    try {
      const response = await fetch(`${API_URL}/api/usuarios/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${user.token}` }
      });

      if (response.ok) {
        alert("Usuario eliminado correctamente.");
        setUsuarios(usuarios.filter(u => (u.account_id || u.id) !== id)); // Lo borramos de la vista
      } else {
        const err = await response.json();
        alert(`Error: ${err.message}`);
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

  const toggleEstado = async (id, estadoActual) => {
    const accion = estadoActual === "active" ? "DESACTIVAR" : "ACTIVAR";
    if (!window.confirm(`¿Estás seguro de que deseas ${accion} a este usuario?`)) return;

    const nuevoEstado = estadoActual === "active" ? "suspended" : "active";
    
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
          (u.account_id || u.id) === id ? { ...u, estado: nuevoEstado, account_status: nuevoEstado } : u
        ));
      } else {
        const err = await response.json();
        alert(`Error al cambiar estado: ${err.message}`);
      }
    } catch (error) {
      console.error("Error de conexión:", error);
    }
  };

  const abrirModalEditar = (u) => {
    setEditFormData({
      id: u.account_id || u.id,
      full_name: u.full_name || u.nombre || "",
      email: u.email || "",
      password: "",
      role_code: u.rol || u.role_code || "registered_user" // Obtenemos el rol actual
    });
    setModalEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/usuarios/${editFormData.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`
        },
        body: JSON.stringify({
          full_name: editFormData.full_name,
          email: editFormData.email,
          role_code: editFormData.role_code, 
          password: editFormData.password || undefined
        })
      });

      if (response.ok) {
        alert("Usuario actualizado correctamente");
        setModalEditOpen(false);
        fetchUsuarios(); // Recargamos la tabla para ver los cambios
      } else {
        const err = await response.json();
        alert(`Error: ${err.message}`);
      }
    } catch (error) {
      console.error("Error actualizando:", error);
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
                      <button className="editar" onClick={() => abrirModalEditar(u)}>Editar</button>
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

      {/*MODAL DE EDICIÓN */}
      {modalEditOpen && (
        <div className="modal-overlay" style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div className="modal-content" style={{ background: "white", padding: "25px", borderRadius: "8px", width: "400px", color: "black", boxShadow: "0 4px 15px rgba(0,0,0,0.2)" }}>
            <h2 style={{ marginTop: 0, marginBottom: "15px", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>Editar Usuario</h2>
            <form onSubmit={handleEditSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              
              <label style={{ fontWeight: "bold", fontSize: "14px" }}>Nombre Completo:</label>
              <input type="text" value={editFormData.full_name} onChange={e => setEditFormData({...editFormData, full_name: e.target.value})} required style={{ padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }} />
              
              <label style={{ fontWeight: "bold", fontSize: "14px" }}>Email:</label>
              <input type="email" value={editFormData.email} onChange={e => setEditFormData({...editFormData, email: e.target.value})} required style={{ padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }} />
              
              <label style={{ fontWeight: "bold", fontSize: "14px" }}>Nueva Contraseña <small style={{ fontWeight: "normal", color: "#666" }}>(Opcional)</small>:</label>
              <input type="password" placeholder="Dejar en blanco para no cambiarla" value={editFormData.password} onChange={e => setEditFormData({...editFormData, password: e.target.value})} style={{ padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }} />
              
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                <button type="button" onClick={() => setModalEditOpen(false)} style={{ background: "#f44336", color: "white", padding: "10px 15px", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Cancelar</button>
                <button type="submit" style={{ background: "#4CAF50", color: "white", padding: "10px 15px", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Guardar Cambios</button>
              </div>

              <label style={{ fontWeight: "bold", fontSize: "14px" }}>Rol del Usuario:</label>
              <select 
                value={editFormData.role_code} 
                onChange={e => setEditFormData({...editFormData, role_code: e.target.value})} 
                required 
                style={{ padding: "10px", borderRadius: "4px", border: "1px solid #ccc", background: "white" }}
              >
                <option value="" disabled>Seleccione un rol</option>
                {rolesDb.map((rol) => (
                  <option key={rol.code} value={rol.code}>
                    {rol.name}
                  </option>
                ))}
              </select>

            </form>
          </div>
        </div>
      )}
      {/*FIN DEL MODAL*/}

    </div>
  );
}

export default GestionUsuarios;