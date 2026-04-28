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

  const [modalEditOpen, setModalEditOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({ id: null, full_name: "", email: "", password: "", role_code: "" });

  const [modalCreateOpen, setModalCreateOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({full_name: "", email: "", username: "", password: "", role_code: "registered_user"});
  
  const usuariosPorPagina = 10;

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
    } catch (error) { console.error("Error:", error); }
  };
  
  useEffect(() => {
    if (user?.token) { fetchUsuarios(); fetchRoles(); }
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
        setCreateFormData({ full_name: "", email: "", username: "", password: "", role_code: "registered_user" });
        fetchUsuarios();
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
      role_code: u.rol || u.role_code || "registered_user"
    });
    setModalEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/usuarios/${editFormData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${user.token}` },
        body: JSON.stringify({ ...editFormData, password: editFormData.password || undefined })
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
              <th>Nombre de Usuario</th>
              <th>Correo Electrónico</th>
              <th>Rol / Privilegios</th>
              <th style={{ textAlign: 'center' }}>Estado</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="gu-table-loading">
                  <Loader2 className="gu-spin-icon" /> Cargando usuarios...
                </td>
              </tr>
            ) : usuariosActuales.length > 0 ? (
              usuariosActuales.map((u) => {
                const id = u.account_id || u.id;
                const estado = (u.estado || u.account_status || 'active').toLowerCase();
                return (
                  <tr key={id}>
                    <td className="gu-td-identity">
                      <div className="gu-user-avatar">
                        {(u.full_name || u.nombre || "U").charAt(0).toUpperCase()}
                      </div>
                      <span>{u.full_name || u.nombre}</span>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <span className="gu-badge-role">
                        <Shield size={12} /> {(u.rol || u.role_code || "").replace("_", " ")}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`gu-status-pill ${estado}`}>
                        {estado === 'active' ? 'Activo' : estado === 'suspended' ? 'Suspendido' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="gu-td-actions">
                      <CanView requiredPermission="user_management.write">
                        <Edit3 className="gu-action-icon" size={20} title="Editar Usuario" onClick={() => abrirModalEditar(u)} />
                        {estado === "active" ? (
                          <UserX className="gu-action-icon gu-icon-suspend" size={20} title="Suspender Acceso" onClick={() => toggleEstado(id, estado)} />
                        ) : (
                          <UserCheck className="gu-action-icon gu-icon-activate" size={20} title="Activar Acceso" onClick={() => toggleEstado(id, estado)} />
                        )}
                      </CanView>
                      <CanView requiredPermission="user_management.delete">
                        <Trash2 className="gu-action-icon gu-icon-delete" size={20} title="Eliminar Permanentemente" onClick={() => handleEliminar(id)} />
                      </CanView>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="5" className="gu-table-empty">No se encontraron usuarios que coincidan con la búsqueda.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="gu-pagination-container">
        <Pagination currentPage={currentPage} totalPages={totalPaginas} onPageChange={setCurrentPage} />
      </div>

      {/* MODALES DE FORMULARIO */}
      {(modalCreateOpen || modalEditOpen) && (
        <div className="gu-modal-overlay">
          <div className="gu-modal-card">
            <div className="gu-modal-header">
              <div className="gu-modal-title-box">
                <Shield className="gu-modal-icon" size={24} />
                <div>
                  <h2>{modalCreateOpen ? 'Crear Nuevo Usuario' : 'Editar Usuario'}</h2>
                  <p>{modalCreateOpen ? 'Registra una nueva cuenta en el sistema' : 'Actualiza los datos del perfil seleccionado'}</p>
                </div>
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

                <div className="gu-modal-input-group">
                  <div className="gu-floating-label">
                    <input 
                      type="email" 
                      placeholder=" "
                      value={modalCreateOpen ? createFormData.email : editFormData.email} 
                      onChange={e => modalCreateOpen ? setCreateFormData({...createFormData, email: e.target.value}) : setEditFormData({...editFormData, email: e.target.value})} 
                      required 
                    />
                    <label>Correo Electrónico</label>
                  </div>
                </div>

                <div className="gu-modal-input-group">
                  <div className="gu-floating-label">
                    <input 
                      type="password" 
                      placeholder=" "
                      value={modalCreateOpen ? createFormData.password : editFormData.password} 
                      onChange={e => modalCreateOpen ? setCreateFormData({...createFormData, password: e.target.value}) : setEditFormData({...editFormData, password: e.target.value})} 
                      required={modalCreateOpen} 
                    />
                    <label>{modalCreateOpen ? 'Contraseña' : 'Nueva Contraseña (opcional)'}</label>
                  </div>
                </div>

                <div className="gu-modal-input-group">
                  <div className="gu-floating-label">
                    <select 
                      value={modalCreateOpen ? createFormData.role_code : editFormData.role_code} 
                      onChange={e => modalCreateOpen ? setCreateFormData({...createFormData, role_code: e.target.value}) : setEditFormData({...editFormData, role_code: e.target.value})} 
                      required
                    >
                      <option value="" disabled hidden></option>
                      {rolesDb.map(rol => <option key={rol.code} value={rol.code}>{rol.name}</option>)}
                    </select>
                    <label>Rol del Sistema</label>
                  </div>
                </div>

              </div>

              <div className="gu-modal-actions">
                <button type="button" className="gu-btn-modal-secondary" onClick={() => { setModalCreateOpen(false); setModalEditOpen(false); }}>
                  Cancelar
                </button>
                <button type="submit" className="gu-btn-modal-primary">
                  {modalCreateOpen ? 'Crear Usuario' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionUsuarios;