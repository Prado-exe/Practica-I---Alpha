import { useState, useEffect, useMemo } from "react";
import { 
  Search, 
  UserPlus, 
  Edit3, 
  Trash2, 
  UserCheck, 
  UserX, 
  RotateCcw,
  Shield,
  Loader2,
  X,
  PlusCircle
} from "lucide-react";
import Pagination from "../../Components/Common/Pagination";
import CanView from "../../Components/Common/CanView";
import { useAuth } from "../../Context/AuthContext"; 
import "../../Styles/Pages_styles/Admin/GestionUsuarios.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function GestionUsuarios() { 
  const { user } = useAuth();
  
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rolesDb, setRolesDb] = useState([]);
  const [search, setSearch] = useState("");
  const [rolFiltro, setRolFiltro] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [institucionesDb, setInstitucionesDb] = useState([]); 
  const [modalEditOpen, setModalEditOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({ id: null, full_name: "", email: "", password: "", role_code: "", institution_id: "" });

  const [modalCreateOpen, setModalCreateOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({full_name: "", email: "", username: "", password: "", role_code: "registered_user", institution_id: ""});
  const usuariosPorPagina = 5;

  const fetchUsuarios = async () => {
    const tokenValido = user?.token || user?.accessToken;
    if (!tokenValido) { setLoading(false); return; }
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/usuarios`, {
        method: "GET", 
        headers: { "Authorization": `Bearer ${tokenValido}`, "Content-Type": "application/json" },
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setUsuarios(data.usuarios || []); 
      }
    } catch (error) { console.error("Error:", error); } finally { setLoading(false); }
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

  const fetchInstitucionesList = async () => {
    const tokenValido = user?.token || user?.accessToken;
    if (!tokenValido) return;

    try {
      const response = await fetch(`${API_URL}/api/instituciones`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${tokenValido}` },
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setInstitucionesDb(data.instituciones || []);
      }
    } catch (error) {
      console.error("Error al obtener instituciones:", error);
    }
  };
  
  useEffect(() => {
    if (user?.token) {
      fetchUsuarios();
      fetchRoles();
      fetchInstitucionesList(); // 👈 AGREGAR AQUÍ
    }
  }, [user?.token]);
  
  useEffect(() => {
    if (user?.token) {
      fetchUsuarios();
      fetchRoles();
    }
  }, [user?.token]);


  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/users/admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${user?.token}` },
        body: JSON.stringify(createFormData)
      });
      if (res.ok) {
        alert("Usuario creado con éxito.");
        setModalCreateOpen(false);
        // Limpiamos el formulario
        setCreateFormData({ full_name: "", email: "", username: "", password: "", role_code: "registered_user", institution_id: "" });
        fetchUsuarios(); // Recargamos la tabla
      } else {
        const err = await res.json();
        alert(err.message || "Error al crear usuario");
      }
    } catch (err) { alert("Error de conexión"); }
  };

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter(u => {
      const userId = String(u.account_id || u.id);
      const myId = String(user?.sub || user?.account_id || user?.id);
      if (userId === myId) return false;
      const nombreUsuario = (u.full_name || u.nombre || "").toLowerCase();
      const emailUsuario = (u.email || "").toLowerCase();
      const terminoBusqueda = search.toLowerCase();
      const rolUsuario = u.rol || u.role_code || "";
      const coincideBusqueda = nombreUsuario.includes(terminoBusqueda) || emailUsuario.includes(terminoBusqueda);
      const coincideRol = rolFiltro ? rolUsuario === rolFiltro : true;
      const coincideEstado = estadoFiltro ? (u.estado || u.account_status) === estadoFiltro : true;
      return coincideBusqueda && coincideRol && coincideEstado;
    });
  }, [usuarios, search, rolFiltro, estadoFiltro, user]);

  const totalPaginas = Math.ceil(usuariosFiltrados.length / usuariosPorPagina) || 1;
  const usuariosActuales = usuariosFiltrados.slice((currentPage - 1) * usuariosPorPagina, currentPage * usuariosPorPagina);

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Eliminar este usuario permanentemente?")) return;
    try {
      const response = await fetch(`${API_URL}/api/usuarios/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if (response.ok) fetchUsuarios();
    } catch (error) { console.error(error); }
  };

  const toggleEstado = async (id, estadoActual) => {
    const nuevoEstado = estadoActual === "active" ? "suspended" : "active";
    try {
      const response = await fetch(`${API_URL}/api/usuarios/${id}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${user.token}` },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      if (response.ok) fetchUsuarios();
    } catch (error) { console.error(error); }
  };

  const abrirModalEditar = (u) => {
    setEditFormData({
      id: u.account_id || u.id,
      full_name: u.full_name || u.nombre || "",
      email: u.email || "",
      password: "",
      role_code: u.rol || u.role_code || "registered_user",
      institution_id: u.institution_id || "" // 👈 AÑADIR AQUÍ
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
          password: editFormData.password || undefined,
          institution_id: editFormData.institution_id || null
        })
      });
      if (response.ok) { setModalEditOpen(false); fetchUsuarios(); }
    } catch (error) { console.error(error); }
  };

  return (
    <div className="gu-container">
      {/* HEADER ADMINISTRATIVO */}
      <div className="gu-header">
        <div className="gu-header-info">
          <h1>Gestión de Usuarios</h1>
          <p>Panel administrativo para control de roles, accesos y estados de cuentas.</p>
        </div>
        <CanView requiredPermission="user_management.write">
          <button className="gu-btn-create" onClick={() => setModalCreateOpen(true)}>
            <PlusCircle size={18} /> Agregar Usuario
          </button>
        </CanView>
      </div>

      {/* SECCIÓN DE FILTROS EN GRID */}
      <div className="gu-filters-section">
        <div className="gu-filters-grid">
          <div className="gu-input-wrapper gu-search-area">
            <label>Buscar Usuario</label>
            <input 
              type="text" 
              placeholder="Nombre o correo..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="gu-input-wrapper">
            <label>Rol</label>
            <select value={rolFiltro} onChange={(e) => setRolFiltro(e.target.value)}>
              <option value="">Todos los roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="user_admin">Admin de Usuarios</option>
              <option value="data_admin">Admin de Datos</option>
              <option value="registered_user">Usuario Registrado</option>
            </select>
          </div>

          <div className="gu-input-wrapper">
            <label>Estado</label>
            <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}>
              <option value="">Cualquier estado</option>
              <option value="active">Activo</option>
              <option value="suspended">Suspendido</option>
              <option value="pending_verification">Pendiente</option>
            </select>
          </div>

          <div className="gu-filter-actions">
            <button className="gu-btn-apply" onClick={fetchUsuarios}>
              <Search size={16} /> APLICAR
            </button>
            <button className="gu-btn-clear" title="Limpiar filtros" onClick={() => { setSearch(""); setRolFiltro(""); setEstadoFiltro(""); }}>
              <RotateCcw size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* TABLA DE DATOS */}
      <div className="gu-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Institución</th>
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
                  <td>{u.institucion_nombre || <span style={{ color: "#888" }}>Sin institución</span>}</td>
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
      </div>

      <div className="gu-pagination-container">
        <Pagination currentPage={currentPage} totalPages={totalPaginas} onPageChange={setCurrentPage} />
      </div>

      {/* 👇 MODAL DE CREACIÓN 👇 */}
      {modalCreateOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Registrar Nuevo Usuario</h2>
            <form onSubmit={handleCreateUser} className="edit-form" style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "20px" }}>
              
              <label style={{ fontWeight: "bold", fontSize: "14px" }}>Nombre Completo:</label>
              <input type="text" value={createFormData.full_name} onChange={e => setCreateFormData({...createFormData, full_name: e.target.value})} required style={{ padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }} />
              
              <label style={{ fontWeight: "bold", fontSize: "14px" }}>Nombre de Usuario (Username):</label>
              <input type="text" value={createFormData.username} onChange={e => setCreateFormData({...createFormData, username: e.target.value})} required style={{ padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }} />

              <label style={{ fontWeight: "bold", fontSize: "14px" }}>Correo Electrónico:</label>
              <input type="email" value={createFormData.email} onChange={e => setCreateFormData({...createFormData, email: e.target.value})} required style={{ padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }} />

              <label style={{ fontWeight: "bold", fontSize: "14px" }}>Contraseña Temporal:</label>
              <input type="password" value={createFormData.password} onChange={e => setCreateFormData({...createFormData, password: e.target.value})} required placeholder="Mínimo 8 caracteres" style={{ padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }} />

              <label style={{ fontWeight: "bold", fontSize: "14px" }}>Asignar Rol:</label>
              <select value={createFormData.role_code} onChange={e => setCreateFormData({...createFormData, role_code: e.target.value})} required style={{ padding: "10px", borderRadius: "4px", border: "1px solid #ccc", background: "white" }}>
                {rolesDb.map(rol => <option key={rol.code} value={rol.code}>{rol.name}</option>)}
              </select>

              {/* 👇 NUEVO SELECTOR DE INSTITUCIÓN 👇 */}
              <label style={{ fontWeight: "bold", fontSize: "14px" }}>Vincular Institución (Opcional):</label>
              <select 
                value={createFormData.institution_id} 
                onChange={e => setCreateFormData({...createFormData, institution_id: e.target.value})} 
                style={{ padding: "10px", borderRadius: "4px", border: "1px solid #ccc", background: "white" }}
              >
                <option value="">-- Sin Institución --</option>
                {institucionesDb.map(inst => (
                  <option key={inst.institution_id} value={inst.institution_id}>{inst.legal_name}</option>
                ))}
              </select>

              {/* LOS BOTONES AHORA VAN AL FINAL */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                <button type="button" onClick={() => setModalCreateOpen(false)} style={{ background: "#f44336", color: "white", padding: "10px 15px", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Cancelar</button>
                <button type="submit" style={{ background: "#4CAF50", color: "white", padding: "10px 15px", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Crear Usuario Activo</button>
              </div>
              <button className="gu-modal-close-btn" onClick={() => { setModalCreateOpen(false); setModalEditOpen(false); }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={modalCreateOpen ? handleCreateUser : handleEditSubmit} className="gu-modal-form">
              <div className="gu-modal-grid">
                
                <div className="gu-modal-input-group full-width">
                  <div className="gu-floating-label">
                    <input 
                      type="text" 
                      placeholder=" "
                      value={modalCreateOpen ? createFormData.full_name : editFormData.full_name} 
                      onChange={e => modalCreateOpen ? setCreateFormData({...createFormData, full_name: e.target.value}) : setEditFormData({...editFormData, full_name: e.target.value})} 
                      required 
                    />
                    <label>Nombre Completo</label>
                  </div>
                </div>

                {modalCreateOpen && (
                  <div className="gu-modal-input-group">
                    <div className="gu-floating-label">
                      <input 
                        type="text" 
                        placeholder=" "
                        value={createFormData.username} 
                        onChange={e => setCreateFormData({...createFormData, username: e.target.value})} 
                        required 
                      />
                      <label>Nombre de Usuario</label>
                    </div>
                  </div>
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

              {/* 👇 NUEVO SELECTOR DE INSTITUCIÓN 👇 */}
              <label style={{ fontWeight: "bold", fontSize: "14px" }}>Vincular Institución (Opcional):</label>
              <select 
                value={editFormData.institution_id} 
                onChange={e => setEditFormData({...editFormData, institution_id: e.target.value})} 
                style={{ padding: "10px", borderRadius: "4px", border: "1px solid #ccc", background: "white" }}
              >
                <option value="">-- Sin Institución --</option>
                {institucionesDb.map(inst => (
                  <option key={inst.institution_id} value={inst.institution_id}>{inst.legal_name}</option>
                ))}
              </select>

              {/* BOTONES AL FINAL */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                <button type="button" onClick={() => setModalEditOpen(false)} style={{ background: "#f44336", color: "white", padding: "10px 15px", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Cancelar</button>
                <button type="submit" style={{ background: "#4CAF50", color: "white", padding: "10px 15px", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Guardar Cambios</button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionUsuarios;