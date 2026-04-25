import { useState, useEffect, useCallback } from "react";
import {
  Plus, List, Save, X, Image as ImageIcon,
  Loader2, Trash2, Edit, Monitor, Link as LinkIcon
} from "lucide-react";
import { useAuth } from "../../Context/AuthContext";
import "../../Styles/Pages_styles/Admin/NoticiasAdmin.css";
import "../../Styles/Pages_styles/Admin/GestionCarrusel.css";

const API = import.meta.env.VITE_API_URL;

const EMPTY_FORM = {
  title: "",
  summary: "",
  content: "",
  image_url: "",
  link_url: "",
  post_status: "draft",
};

function GestionCarrusel() {
  const { user } = useAuth();
  const [view, setView]               = useState("list");
  const [loading, setLoading]         = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [slides, setSlides]           = useState([]);
  const [noticias, setNoticias]       = useState([]);   // noticias existentes
  const [editingId, setEditingId]     = useState(null);
  const [mensaje, setMensaje]         = useState({ tipo: "", texto: "" });
  const [previewSlide, setPreviewSlide] = useState(null);
  const [formData, setFormData]       = useState(EMPTY_FORM);

  /* ── Fetch carousel slides ── */
  const fetchSlides = useCallback(async () => {
    try {
      setLoadingList(true);
      const res  = await fetch(`${API}/api/carousel`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      const data = await res.json();
      if (data.ok) setSlides(data.data ?? []);
    } catch (err) {
      console.error("Error cargando slides:", err);
    } finally {
      setLoadingList(false);
    }
  }, [user?.token]);

  /* ── Fetch noticias publicadas para el picker ── */
  const fetchNoticias = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/api/public/news`);
      const data = await res.json();
      if (data.ok) setNoticias(data.data ?? []);
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (user?.token) { fetchSlides(); fetchNoticias(); }
  }, [user?.token, fetchSlides, fetchNoticias]);

  /* ── Handlers ── */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /* Cuando el admin elige una noticia existente, auto-completa el formulario */
  const handleNoticiaSelect = (e) => {
    const id = Number(e.target.value);
    if (!id) return;
    const noticia = noticias.find((n) => n.news_post_id === id);
    if (!noticia) return;

    setFormData((prev) => ({
      ...prev,
      title:     noticia.title      ?? prev.title,
      summary:   noticia.summary    ?? prev.summary,
      image_url: noticia.cover_image ?? prev.image_url,
      link_url:  `/noticias/${noticia.slug}`,
    }));
  };

  const openCreate = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setMensaje({ tipo: "", texto: "" });
    setView("form");
  };

  const openEdit = (slide) => {
    setEditingId(slide.news_post_id);
    setFormData({
      title:       slide.title       ?? "",
      summary:     slide.summary     ?? "",
      content:     slide.content     ?? "",
      image_url:   slide.image_url   ?? "",
      link_url:    slide.link_url    ?? "",
      post_status: slide.post_status ?? "draft",
    });
    setMensaje({ tipo: "", texto: "" });
    setView("form");
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este slide del carrusel?")) return;
    try {
      const res  = await fetch(`${API}/api/carousel/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      const data = await res.json();
      if (data.ok) {
        setSlides((prev) => prev.filter((s) => s.news_post_id !== id));
        if (previewSlide?.news_post_id === id) setPreviewSlide(null);
      }
    } catch (err) {
      console.error("Error eliminando:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensaje({ tipo: "", texto: "" });
    try {
      const url = editingId
        ? `${API}/api/carousel/${editingId}`
        : `${API}/api/carousel`;

      const res  = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? "Error al guardar");

      setMensaje({
        tipo: "success",
        texto: editingId ? "Slide actualizado" : "Slide creado correctamente",
      });
      setTimeout(() => { setView("list"); fetchSlides(); }, 1200);
    } catch (err) {
      setMensaje({ tipo: "error", texto: err.message });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleDateString("es-CL", {
        day: "numeric", month: "short", year: "numeric",
      });
    } catch { return d; }
  };

  /* ── Render ── */
  return (
    <div className="admin-page-container">

      {/* Header */}
      <div className="admin-header-flex">
        <div>
          <h1 className="admin-title">Carrusel Principal</h1>
          <p className="admin-subtitle">Gestiona los slides de la página de inicio.</p>
        </div>
        <button
          className={view === "list" ? "btn-primary" : "btn-secondary"}
          onClick={() => (view === "list" ? openCreate() : setView("list"))}
        >
          {view === "list"
            ? <><Plus size={18} /> Nuevo Slide</>
            : <><List size={18} /> Ver Lista</>}
        </button>
      </div>

      {/* ── LIST ── */}
      {view === "list" && (
        <div className="admin-card fade-in">
          {loadingList ? (
            <div className="loading-state"><Loader2 className="spin" /> Cargando...</div>
          ) : slides.length > 0 ? (
            <>
              {previewSlide && (
                <div
                  className="gc-preview-card"
                  style={previewSlide.image_url
                    ? { backgroundImage: `url(${previewSlide.image_url})` }
                    : undefined}
                >
                  <div className="gc-preview-overlay">
                    <span className="gc-preview-badge">Destacado</span>
                    <h3 className="gc-preview-title">{previewSlide.title}</h3>
                    {previewSlide.summary && (
                      <p className="gc-preview-subtitle">{previewSlide.summary}</p>
                    )}
                    {previewSlide.link_url && (
                      <p className="gc-preview-link">
                        <LinkIcon size={12} /> {previewSlide.link_url}
                      </p>
                    )}
                  </div>
                  <button className="gc-preview-close" onClick={() => setPreviewSlide(null)}>
                    <X size={16} />
                  </button>
                </div>
              )}

              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Imagen</th>
                      <th>Título</th>
                      <th>Enlace</th>
                      <th>Estado</th>
                      <th>Fecha</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slides.map((slide) => (
                      <tr key={slide.news_post_id}>
                        <td>
                          {slide.image_url
                            ? <img src={slide.image_url} alt={slide.title} className="gc-thumbnail"
                                onError={(e) => { e.target.style.display = "none"; }} />
                            : <div className="gc-no-image"><ImageIcon size={20} /></div>}
                        </td>
                        <td className="font-medium">{slide.title}</td>
                        <td className="gc-link-cell">
                          {slide.link_url
                            ? <span title={slide.link_url}><LinkIcon size={13} /> {slide.link_url}</span>
                            : <span className="gc-no-link">—</span>}
                        </td>
                        <td>
                          <span className={`badge ${slide.post_status}`}>
                            {slide.post_status === "published" ? "Publicado" : "Borrador"}
                          </span>
                        </td>
                        <td>{formatDate(slide.published_at)}</td>
                        <td className="actions-cell">
                          <button className="btn-icon" title="Vista previa"
                            onClick={() => setPreviewSlide(slide)}>
                            <Monitor size={16} />
                          </button>
                          <button className="btn-icon" title="Editar"
                            onClick={() => openEdit(slide)}>
                            <Edit size={16} />
                          </button>
                          <button className="btn-icon delete" title="Eliminar"
                            onClick={() => handleDelete(slide.news_post_id)}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <ImageIcon size={48} className="empty-icon" />
              <h3>No hay slides</h3>
              <p>Crea el primer slide para el carrusel de inicio.</p>
              <button className="btn-primary mt-4" onClick={openCreate}>
                Crear primer slide
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── FORM ── */}
      {view === "form" && (
        <div className="admin-card fade-in">
          <h2 className="gc-form-title">
            {editingId ? "Editar Slide" : "Nuevo Slide"}
          </h2>

          <form onSubmit={handleSubmit}>

            {/* Selector de noticia existente */}
            {noticias.length > 0 && (
              <div className="gc-news-picker">
                <label className="gc-picker-label">
                  <LinkIcon size={15} /> Vincular noticia existente
                  <span className="gc-optional"> (auto-completa los campos)</span>
                </label>
                <select onChange={handleNoticiaSelect} defaultValue="">
                  <option value="" disabled>Selecciona una noticia…</option>
                  {noticias.map((n) => (
                    <option key={n.news_post_id} value={n.news_post_id}>
                      {n.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-grid">
              {/* Left column */}
              <div className="form-column">
                <div className="form-group">
                  <label>Título del slide <span className="gc-required">*</span></label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Ej: Nuevo conjunto de datos disponible"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Subtítulo <span className="gc-optional">(opcional)</span></label>
                  <input
                    type="text"
                    name="summary"
                    value={formData.summary}
                    onChange={handleInputChange}
                    placeholder="Frase destacada o subtítulo"
                    maxLength="500"
                  />
                </div>

                <div className="form-group">
                  <label>Descripción <span className="gc-optional">(opcional)</span></label>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Texto complementario del slide"
                  />
                </div>
              </div>

              {/* Right column */}
              <div className="form-column side-column">
                <div className="form-group">
                  <label>Estado</label>
                  <select name="post_status" value={formData.post_status} onChange={handleInputChange}>
                    <option value="draft">Borrador</option>
                    <option value="published">Publicado</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    <LinkIcon size={13} style={{ marginRight: 4, verticalAlign: "middle" }} />
                    Enlace "Ver más"
                  </label>
                  <input
                    type="text"
                    name="link_url"
                    value={formData.link_url}
                    onChange={handleInputChange}
                    placeholder="/noticias/mi-noticia"
                  />
                  <p className="gc-field-hint">
                    Se autocompleta al seleccionar una noticia arriba.
                  </p>
                </div>

                <div className="form-group">
                  <label>URL de imagen <span className="gc-optional">(opcional)</span></label>
                  <input
                    type="text"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleInputChange}
                    placeholder="Se autocompleta desde la noticia"
                  />
                  {formData.image_url && (
                    <div className="gc-img-preview">
                      <img
                        src={formData.image_url}
                        alt="Vista previa"
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Live preview */}
            {formData.title && (
              <div className="gc-live-preview">
                <p className="gc-preview-label">Vista previa del slide</p>
                <div
                  className="gc-preview-card"
                  style={formData.image_url
                    ? { backgroundImage: `url(${formData.image_url})` }
                    : undefined}
                >
                  <div className="gc-preview-overlay">
                    <span className="gc-preview-badge">Destacado</span>
                    <h3 className="gc-preview-title">{formData.title}</h3>
                    {formData.summary && (
                      <p className="gc-preview-subtitle">{formData.summary}</p>
                    )}
                    {formData.link_url && (
                      <p className="gc-preview-link">
                        <LinkIcon size={12} /> {formData.link_url}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {mensaje.texto && (
              <div className={`form-message ${mensaje.tipo}`}>{mensaje.texto}</div>
            )}

            <div className="form-actions">
              <button type="button" className="btn-ghost" onClick={() => setView("list")}>
                <X size={18} /> Cancelar
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
                {editingId ? "Actualizar slide" : "Crear slide"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default GestionCarrusel;
