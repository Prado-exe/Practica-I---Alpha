import { useState, useEffect, useCallback } from "react";
import { Plus, List, Save, X, FileText, Loader2, Trash2, Edit, Star, EyeOff, Eye } from "lucide-react";
import "../../Styles/Pages_styles/Admin/NoticiasAdmin.css";
import { useAuth } from "../../Context/AuthContext";
import { getDatasets } from "../../Services/DatasetService";

function NoticiasAdmin() {
  const { user } = useAuth();
  const [view, setView] = useState("list"); 
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [noticias, setNoticias] = useState([]);
  
  // Estados para datos dinámicos
  const [newsCategories, setNewsCategories] = useState([]);
  const [generalCategories, setGeneralCategories] = useState([]);
  const [datasetsList, setDatasetsList] = useState([]);
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });

  // Archivos físicos y Edición
  const [coverFile, setCoverFile] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [editingId, setEditingId] = useState(null); // 👈 Controla si estamos creando o editando

  const initialForm = {
    title: "", summary: "", content: "",
    post_type: "news", news_category_id: "", category_id: "", dataset_id: "",
    post_status: "draft", is_featured: false
  };

  const [formData, setFormData] = useState(initialForm);

  const fetchData = useCallback(async () => {
    try {
      setLoadingList(true);
      const resNews = await fetch(`${import.meta.env.VITE_API_URL}/api/news/admin`, {
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
  }, [user?.token]);

  useEffect(() => {
    if (user?.token) fetchData();
  }, [user?.token, fetchData]);

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

      // 👈 Diferenciamos entre Crear (POST) y Editar (PUT)
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

  // ==========================================
  // 🚀 FUNCIONES DE LOS BOTONES DE LA TABLA
  // ==========================================

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
    if (!window.confirm("¿Estás seguro de destruir esta publicación y sus imágenes?")) return;
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
    <div className="admin-page-container">
      <div className="admin-header-flex">
        <div>
          <h1 className="admin-title">Gestión de Contenido</h1>
          <p className="admin-subtitle">Administra las noticias y publicaciones.</p>
        </div>
        <button className="btn-primary" onClick={() => { 
          setView(view === "list" ? "create" : "list"); 
          if (view === "list") { setFormData(initialForm); setEditingId(null); }
        }}>
          {view === "list" ? <><Plus size={18} /> Nuevo</> : <><List size={18} /> Ver Lista</>}
        </button>
      </div>

      {view === "list" && (
        <div className="admin-card fade-in">
          {loadingList ? (
             <div className="loading-state"><Loader2 className="spin" /> Cargando...</div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Título</th>
                    <th>Tipo</th>
                    <th>Estado</th>
                    <th>Destacado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {noticias.map((n) => (
                    <tr key={n.news_post_id} className={n.post_status === 'archived' ? 'row-archived' : ''}>
                      <td>{n.title}</td>
                      <td><span className={`type-tag ${n.post_type}`}>{n.post_type === 'news' ? 'Noticia' : 'Publicación'}</span></td>
                      <td>
                        <span className={`badge ${n.post_status}`}>
                           {n.post_status === 'archived' ? 'Oculto' : n.post_status}
                        </span>
                      </td>
                      <td>{n.is_featured ? <Star size={16} fill="#f59e0b" color="#f59e0b" /> : "—"}</td>
                      <td className="actions-cell">
                        {/* 🚀 BOTONES CONECTADOS */}
                        <button className="btn-icon" title="Editar" onClick={() => startEdit(n)}><Edit size={16} /></button>
                        <button className="btn-icon" title={n.post_status === 'archived' ? "Mostrar" : "Ocultar"} onClick={() => handleToggleVisibility(n.news_post_id, n.post_status)}>
                          {n.post_status === 'archived' ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                        <button className="btn-icon delete" title="Borrar" onClick={() => handleDelete(n.news_post_id)}><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {view === "create" && (
        <div className="admin-card fade-in">
          <form onSubmit={handleSubmit} className="news-form">
            <div className="form-grid">
              <div className="form-column">
                <div className="form-group">
                  <label>Tipo de Contenido</label>
                  <select name="post_type" value={formData.post_type} onChange={handleInputChange} disabled={editingId !== null}>
                    <option value="news">Noticia</option>
                    <option value="post">Publicación</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Título *</label>
                  <input type="text" name="title" value={formData.title} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Resumen (Máx 500 caracteres)</label>
                  <textarea name="summary" value={formData.summary} onChange={handleInputChange} rows="3" maxLength="500" />
                </div>
                <div className="form-group">
                  <label>Contenido *</label>
                  <textarea name="content" className="content-textarea" value={formData.content} onChange={handleInputChange} required />
                </div>
              </div>

              <div className="form-column side-column">
                <div className="form-group">
                  <label>Imagen Portada</label>
                  <input type="file" accept=".jpg, .jpeg, .png, .webp" onChange={(e) => setCoverFile(e.target.files[0])} />
                </div>

                <div className="form-group">
                  <label>Galería (Múltiples Imágenes)</label>
                  <input type="file" accept=".jpg, .jpeg, .png, .webp" multiple onChange={(e) => setGalleryFiles(Array.from(e.target.files))} />
                  {galleryFiles.length > 0 && <small>{galleryFiles.length} imágenes seleccionadas</small>}
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input type="checkbox" name="is_featured" checked={formData.is_featured} onChange={handleInputChange} />
                    Marcar como Destacado
                  </label>
                </div>

                <div className="form-group">
                  <label>Estado Inicial</label>
                  <select name="post_status" value={formData.post_status} onChange={handleInputChange}>
                    <option value="draft">Borrador</option>
                    <option value="published">Publicado</option>
                    <option value="archived">Oculto (Archivado)</option>
                  </select>
                </div>

                {formData.post_type === "news" ? (
                  <div className="form-group">
                    <label>Categoría de Noticia</label>
                    <select name="news_category_id" value={formData.news_category_id} onChange={handleInputChange} required>
                      <option value="">Seleccione...</option>
                      {newsCategories.map(c => <option key={c.news_category_id} value={c.news_category_id}>{c.name}</option>)}
                    </select>
                  </div>
                ) : (
                  <div className="form-group">
                    <label>Categoría General</label>
                    <select name="category_id" value={formData.category_id} onChange={handleInputChange} required>
                      <option value="">Seleccione...</option>
                      {generalCategories.map(cat => <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>)}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label>Vincular Dataset (Opcional)</label>
                  <select name="dataset_id" value={formData.dataset_id} onChange={handleInputChange}>
                    <option value="">-- Ninguno --</option>
                    {datasetsList.map(ds => <option key={ds.dataset_id} value={ds.dataset_id}>{ds.nombre || ds.title}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {mensaje.texto && <div className={`form-message ${mensaje.tipo}`}>{mensaje.texto}</div>}

            <div className="form-actions">
              <button type="button" className="btn-ghost" onClick={() => { setView("list"); setEditingId(null); setFormData(initialForm); }}><X size={18} /> Cancelar</button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? <Loader2 size={18} className="spin" /> : <Save size={18} />} {editingId ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default NoticiasAdmin;