import { useState, useEffect, useCallback } from "react";
import { 
  Plus, 
  List, 
  Save, 
  X, 
  Loader2, 
  Trash2, 
  Edit, 
  Star, 
  EyeOff, 
  Eye, 
  Search, 
  RotateCcw,
  PlusCircle
} from "lucide-react";
import "../../Styles/Pages_styles/Admin/NoticiasAdmin.css";
import { useAuth } from "../../Context/AuthContext";
import { getDatasets } from "../../Services/DatasetService";

function NoticiasAdmin() {
  const { user } = useAuth();
  const [view, setView] = useState("list"); 
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [noticias, setNoticias] = useState([]);
  
  const [newsCategories, setNewsCategories] = useState([]);
  const [generalCategories, setGeneralCategories] = useState([]);
  const [datasetsList, setDatasetsList] = useState([]);
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });

  const [filters, setFilters] = useState({
    titulo: "",
    tipo: "",
    estado: "",
    categoria: "",
    destacado: false
  });

  const [coverFile, setCoverFile] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const initialForm = {
    title: "", summary: "", content: "",
    post_type: "news", news_category_id: "", category_id: "", dataset_id: "",
    post_status: "draft", is_featured: false
  };

  const [formData, setFormData] = useState(initialForm);

  const fetchData = useCallback(async (appliedFilters = filters) => {
    try {
      setLoadingList(true);
      const params = new URLSearchParams();
      if (appliedFilters.titulo) params.append("search", appliedFilters.titulo);
      if (appliedFilters.tipo) params.append("tipo", appliedFilters.tipo);
      if (appliedFilters.estado) params.append("estado", appliedFilters.estado);
      if (appliedFilters.categoria) params.append("categoria", appliedFilters.categoria);
      if (appliedFilters.destacado) params.append("is_featured", "true");

      const queryString = params.toString();
      const endpoint = `${import.meta.env.VITE_API_URL}/api/news/admin${queryString ? `?${queryString}` : ''}`;

      const resNews = await fetch(endpoint, {
        headers: { "Authorization": `Bearer ${user?.token}` }
      });
      const dataNews = await resNews.json();
      if (dataNews.ok) setNoticias(dataNews.data || []);

      const resCat = await fetch(`${import.meta.env.VITE_API_URL}/api/news-categories`);
      if (resCat.ok) {
        const dataCat = await resCat.json();
        setNewsCategories(dataCat.data || []);
      }

      const resGenCat = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`);
      if (resGenCat.ok) {
        const catG = await resGenCat.json();
        setGeneralCategories(catG.data || []);
      }

      const resDs = await getDatasets({ limit: 200 });
      if (resDs?.data) setDatasetsList(resDs.data);

    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoadingList(false);
    }
  }, [user?.token, filters]);

  useEffect(() => {
    if (user?.token) fetchData();
  }, [user?.token, fetchData]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleApplyFilters = () => fetchData(filters);

  const handleClearFilters = () => {
    const empty = { titulo: "", tipo: "", estado: "", categoria: "", destacado: false };
    setFilters(empty);
    fetchData(empty);
  };

  const handleToggleDestacados = () => {
    const newFilters = { ...filters, destacado: !filters.destacado };
    setFilters(newFilters);
    fetchData(newFilters);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const uploadFile = async (file, role) => {
    const resUrl = await fetch(`${import.meta.env.VITE_API_URL}/api/upload/presigned-url/user`, {
      method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${user?.token}` },
      body: JSON.stringify({ fileName: file.name, contentType: file.type })
    });
    const { uploadUrl, fileUrl, storageKey } = await resUrl.json();
    await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });

    return {
      storage_key: storageKey, file_url: fileUrl, file_role: role,
      display_name: file.name, file_format: file.name.split('.').pop().toLowerCase(),
      mime_type: file.type, file_size_bytes: file.size, display_order: 1
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensaje({ tipo: "", texto: "" });

    try {
      let uploadedFiles = [];
      if (coverFile) uploadedFiles.push(await uploadFile(coverFile, 'cover'));
      if (galleryFiles && galleryFiles.length > 0) {
         for (const file of galleryFiles) uploadedFiles.push(await uploadFile(file, 'gallery'));
      }

      const payload = {
        ...formData,
        news_category_id: formData.post_type === "news" ? Number(formData.news_category_id) : null,
        category_id: formData.post_type === "post" ? Number(formData.category_id) : null,
        dataset_id: formData.dataset_id ? Number(formData.dataset_id) : null,
        files: uploadedFiles.length > 0 ? uploadedFiles : undefined
      };

      const url = editingId 
        ? `${import.meta.env.VITE_API_URL}/api/news/${editingId}` 
        : `${import.meta.env.VITE_API_URL}/api/news`;
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method, headers: { "Content-Type": "application/json", "Authorization": `Bearer ${user?.token}` },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Fallo al guardar");

      setMensaje({ tipo: "success", texto: editingId ? "Actualizado correctamente" : "Registro guardado" });
      setFormData(initialForm); setCoverFile(null); setGalleryFiles([]); setEditingId(null);
      fetchData();
      setTimeout(() => setView("list"), 1500);

    } catch (error) {
      setMensaje({ tipo: "error", texto: error.message });
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (noticia) => {
    setFormData({
      title: noticia.title, summary: noticia.summary || "", content: noticia.content,
      post_type: noticia.post_type, 
      news_category_id: noticia.news_category_id || "", category_id: noticia.category_id || "", 
      dataset_id: noticia.dataset_id || "", post_status: noticia.post_status, is_featured: noticia.is_featured
    });
    setEditingId(noticia.news_post_id);
    setView("create");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de destruir esta publicación permanentemente?")) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/news/${id}`, {
        method: "DELETE", headers: { "Authorization": `Bearer ${user?.token}` }
      });
      if (res.ok) fetchData();
    } catch (error) {
      alert("Error al eliminar.");
    }
  };

  const handleToggleVisibility = async (id, currentStatus) => {
    const isCurrentlyHidden = currentStatus === 'archived';
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/news/${id}/visibility`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${user?.token}` },
        body: JSON.stringify({ hide: !isCurrentlyHidden })
      });
      if (res.ok) fetchData();
    } catch (error) {
      alert("Error al cambiar visibilidad.");
    }
  };

  return (
    <div className="na-main-layout">
      {/* CABECERA ALINEADA */}
      <div className="na-top-header">
        <div className="na-header-texts">
          <h1>Gestión de Noticias y Publicaciones</h1>
          <p>Administra el contenido informativo y educativo del observatorio.</p>
        </div>
        <button 
          className="na-btn-primary na-btn-add" 
          onClick={() => { 
            setView(view === "list" ? "create" : "list"); 
            if (view === "list") { setFormData(initialForm); setEditingId(null); }
          }}
        >
          {view === "list" ? (
            <><PlusCircle size={18} /> Agregar Contenido</>
          ) : (
            <><List size={18} /> Ver Listado</>
          )}
        </button>
      </div>

      {view === "list" ? (
        <div className="na-list-view na-fade-in">
          {/* SECCIÓN DE FILTROS TIPO TARJETA */}
          <div className="na-filters-card">
            <div className="na-filters-grid">
              <div className="na-field-group na-search-field">
                <label>Buscar</label>
                <input 
                  type="text" 
                  name="titulo"
                  placeholder="Título de la entrada..." 
                  value={filters.titulo}
                  onChange={handleFilterChange}
                />
              </div>

              <div className="na-field-group">
                <label>Tipo</label>
                <select name="tipo" value={filters.tipo} onChange={handleFilterChange}>
                  <option value="">Todos los tipos</option>
                  <option value="news">Noticias</option>
                  <option value="post">Publicaciones</option>
                </select>
              </div>

              <div className="na-field-group">
                <label>Estado</label>
                <select name="estado" value={filters.estado} onChange={handleFilterChange}>
                  <option value="">Cualquier estado</option>
                  <option value="published">Publicado</option>
                  <option value="draft">Borrador</option>
                  <option value="archived">Oculto</option>
                </select>
              </div>

              <div className="na-filters-buttons">
                <button className="na-btn-apply" onClick={handleApplyFilters}>
                  <Search size={16} /> APLICAR
                </button>
                <button
                  className={`na-btn-featured${filters.destacado ? " na-btn-featured--active" : ""}`}
                  onClick={handleToggleDestacados}
                  title={filters.destacado ? "Mostrando solo destacados — clic para ver todos" : "Filtrar por destacados"}
                >
                  <Star size={16} fill={filters.destacado ? "#92400e" : "none"} />
                  Destacados
                </button>
                <button className="na-btn-reset" onClick={handleClearFilters} title="Limpiar filtros">
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* CONTENEDOR DE TABLA TIPO PANEL */}
          <div className="na-data-table-wrapper">
            {loadingList ? (
              <div className="na-loading-placeholder">
                <Loader2 className="na-spin-icon" /> 
                <span>Cargando contenido...</span>
              </div>
            ) : (
              <table className="na-admin-table">
                <thead>
                  <tr>
                    <th>Título</th>
                    <th>Tipo</th>
                    <th style={{ textAlign: 'center' }}>Estado</th>
                    <th style={{ textAlign: 'center' }}>Destacado</th>
                    <th style={{ textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {noticias.length > 0 ? noticias.map((n) => {
                    const status = (n.post_status || 'draft').toLowerCase();
                    return (
                      <tr key={n.news_post_id}>
                        <td className="na-td-title">{n.title}</td>
                        <td>
                          <span className={`na-type-label na-type-${n.post_type}`}>
                            {n.post_type === 'news' ? 'Noticia' : 'Publicación'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`na-status-pill na-status-${status}`}>
                            {status === 'published' ? 'Publicado' : 
                             status === 'draft' ? 'Borrador' : 
                             status === 'archived' ? 'Oculto' : status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {n.is_featured ? <Star size={18} fill="#ffcc00" color="#ffcc00" /> : "—"}
                        </td>
                        <td className="na-actions-cell">
                          <Edit 
                            className="na-icon-action na-icon-edit" 
                            size={20} 
                            title="Editar" 
                            onClick={() => startEdit(n)} 
                          />
                          <div onClick={() => handleToggleVisibility(n.news_post_id, n.post_status)}>
                            {n.post_status === 'archived' ? (
                              <Eye className="na-icon-action na-icon-view" size={20} title="Mostrar" />
                            ) : (
                              <EyeOff className="na-icon-action na-icon-hide" size={20} title="Ocultar" />
                            )}
                          </div>
                          <Trash2 
                            className="na-icon-action na-icon-delete" 
                            size={20} 
                            title="Eliminar" 
                            onClick={() => handleDelete(n.news_post_id)} 
                          />
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan="5" className="na-td-empty">
                        No se encontraron registros de contenido.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        /* FORMULARIO ORGANIZADO */
        <div className="na-form-card na-fade-in">
          <form onSubmit={handleSubmit} className="na-admin-form">
            <div className="na-form-columns">
              <div className="na-col-main">
                <div className="na-form-field">
                  <label>Título de la entrada *</label>
                  <input type="text" name="title" value={formData.title} onChange={handleInputChange} placeholder="Ej: Importancia del Desarrollo Sostenible" required />
                </div>
                <div className="na-form-field">
                  <label>Resumen informativo</label>
                  <textarea name="summary" value={formData.summary} onChange={handleInputChange} rows="3" placeholder="Breve descripción para la vista previa..." maxLength="500" />
                </div>
                <div className="na-form-field">
                  <label>Contenido extendido *</label>
                  <textarea name="content" className="na-textarea-large" value={formData.content} onChange={handleInputChange} placeholder="Desarrolla la noticia o publicación aquí..." required />
                </div>
              </div>

              <div className="na-col-sidebar">
                <div className="na-sidebar-box">
                  <div className="na-form-field">
                    <label>Naturaleza del contenido</label>
                    <select name="post_type" value={formData.post_type} onChange={handleInputChange} disabled={editingId !== null}>
                      <option value="news">Noticia</option>
                      <option value="post">Publicación</option>
                    </select>
                  </div>

                  <div className="na-form-field">
                    <label>Imagen principal (Portada)</label>
                    <input type="file" accept="image/*" className="na-file-input" onChange={(e) => setCoverFile(e.target.files[0])} />
                  </div>

                  <div className="na-form-field">
                    <label>Estado de visibilidad</label>
                    <select name="post_status" value={formData.post_status} onChange={handleInputChange}>
                      <option value="draft">Borrador</option>
                      <option value="published">Publicado</option>
                      <option value="archived">Oculto</option>
                    </select>
                  </div>

                  <div className="na-check-group">
                    <input type="checkbox" id="is_featured" name="is_featured" checked={formData.is_featured} onChange={handleInputChange} />
                    <label htmlFor="is_featured">Marcar como destacado</label>
                  </div>

                  {formData.post_type === "news" ? (
                    <div className="na-form-field">
                      <label>Categoría de noticia</label>
                      <select name="news_category_id" value={formData.news_category_id} onChange={handleInputChange} required>
                        <option value="">Seleccionar categoría...</option>
                        {newsCategories.map(c => <option key={c.news_category_id} value={c.news_category_id}>{c.name}</option>)}
                      </select>
                    </div>
                  ) : (
                    <div className="na-form-field">
                      <label>Área temática</label>
                      <select name="category_id" value={formData.category_id} onChange={handleInputChange} required>
                        <option value="">Seleccionar área...</option>
                        {generalCategories.map(cat => <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {mensaje.texto && (
              <div className={`na-alert-msg na-alert-${mensaje.tipo}`}>
                {mensaje.texto}
              </div>
            )}

            <div className="na-form-actions">
              <button type="button" className="na-btn-secondary" onClick={() => { setView("list"); setEditingId(null); }}>
                Cancelar
              </button>
              <button type="submit" className="na-btn-primary na-btn-submit" disabled={loading}>
                {loading ? <Loader2 className="na-spin-icon" size={18} /> : <Save size={18} />}
                {editingId ? 'Actualizar Contenido' : 'Publicar Contenido'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default NoticiasAdmin;