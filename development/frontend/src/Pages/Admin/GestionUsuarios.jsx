import { useState, useMemo } from "react";
import SearchBarAdvanced from "../../Components/Common/SearchBarAdvanced";
import Pagination from "../../Components/Common/Pagination";
import "../../Styles/Pages_styles/Admin/GestionUsuarios.css";

const usuariosMock = [
  { id: 1, nombre: "bastian pradenas", email: "juan@mail.com", rol: "admin", estado: "activo" },
  { id: 2, nombre: "Ana Torres", email: "ana@mail.com", rol: "usuario", estado: "inactivo" },
  { id: 3, nombre: "Luis Soto", email: "luis@mail.com", rol: "usuario", estado: "activo" },
  // agrega más para probar
];

function GestionUsuarios() {

  const [usuarios, setUsuarios] = useState(usuariosMock);
  const [search, setSearch] = useState("");
  const [rolFiltro, setRolFiltro] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const usuariosPorPagina = 5;

  // 🔍 Filtrado
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter(u => {
      return (
        u.nombre.toLowerCase().includes(search.toLowerCase()) &&
        (rolFiltro ? u.rol === rolFiltro : true) &&
        (estadoFiltro ? u.estado === estadoFiltro : true)
      );
    });
  }, [usuarios, search, rolFiltro, estadoFiltro]);

  // 📄 Paginación
  const totalPaginas = Math.ceil(usuariosFiltrados.length / usuariosPorPagina);

  const usuariosActuales = usuariosFiltrados.slice(
    (currentPage - 1) * usuariosPorPagina,
    currentPage * usuariosPorPagina
  );

  // ❌ Eliminar usuario
  const handleEliminar = (id) => {
    setUsuarios(usuarios.filter(u => u.id !== id));
  };

  // 🔄 Cambiar estado
  const toggleEstado = (id) => {
    setUsuarios(usuarios.map(u =>
      u.id === id
        ? { ...u, estado: u.estado === "activo" ? "inactivo" : "activo" }
        : u
    ));
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
          <option value="admin">Admin</option>
          <option value="usuario">Usuario</option>
        </select>

        <select onChange={(e) => setEstadoFiltro(e.target.value)}>
          <option value="">Todos</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>

        <button onClick={() => {
          setSearch("");
          setRolFiltro("");
          setEstadoFiltro("");
        }}>
          Limpiar filtros
        </button>

      </div>

      {/* 📋 TABLA */}
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
          {usuariosActuales.map(u => (
            <tr key={u.id}>
              <td>{u.nombre}</td>
              <td>{u.email}</td>
              <td>{u.rol}</td>
              <td>
                <span className={`estado ${u.estado}`}>
                  {u.estado}
                </span>
              </td>
              <td className="acciones">
                <button onClick={() => toggleEstado(u.id)}>
                  {u.estado === "activo" ? "Desactivar" : "Activar"}
                </button>
                <button className="editar">Editar</button>
                <button className="eliminar" onClick={() => handleEliminar(u.id)}>
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 📄 PAGINACIÓN */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPaginas}
        onPageChange={setCurrentPage}
      />

    </div>
  );
}

export default GestionUsuarios;