import { useState, useEffect, useCallback } from "react";
import { Plus, List, Save, X, Image as ImageIcon, FileText, Loader2, Trash2, Edit } from "lucide-react";
import "../../Styles/Pages_styles/Admin/NoticiasAdmin.css";
import { useAuth } from "../../Context/AuthContext";

function NoticiasAdmin() {
  const { user } = useAuth();
  const [view, setView] = useState("list"); 
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [noticias, setNoticias] = useState([]);
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });

  // Estado del formulario ajustado para manejar ambos tipos
  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    content: "",
    post_type: "news", // 'news' o 'post'
    news_category_id: "1", 
    category_id: "", // Para post_type = 'post'
    post_status: "draft"
  });

  const fetchNoticias = useCallback(async () => {
    try {
        setLoadingList(true);

        const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/public/news`, // 👈 FIX AQUÍ
        {
            headers: {
            "Authorization": `Bearer ${user?.token}` // opcional para público
            }
        }
        );

        const data = await response.json();

        if (data.ok) setNoticias(data.data || []);

    } catch (error) {
        console.error("Error cargando:", error);
    } finally {
        setLoadingList(false);
    }
    }, [user?.token]);

  useEffect(() => {
    if (user?.token) fetchNoticias();
  }, [user?.token, fetchNoticias]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    // 🔹 Validación crítica antes de enviar
    if (!user?.account_id && !user?.id) {
      throw new Error("Usuario no válido (author_account_id requerido)");
    }

    if (!formData.title || !formData.content) {
      throw new Error("Título y contenido son obligatorios");
    }

    if (formData.post_type === "post" && !formData.category_id) {
      throw new Error("category_id es obligatorio para publicaciones");
    }

    if (formData.post_type === "news" && !formData.news_category_id) {
      throw new Error("news_category_id es obligatorio para noticias");
    }

    // 🔹 Generar slug seguro (y evitar duplicados básicos)
    const generatedSlug = formData.title
      .toLowerCase()
      .trim()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-") + "-" + Date.now(); // 👈 evita duplicados

    // 🔹 Construcción estricta
    const payload = {
      title: formData.title.trim(),
      content: formData.content.trim(),
      post_type: formData.post_type,
      post_status: formData.post_status,
      slug: generatedSlug,
      author_account_id: Number(user.account_id || user.id),
      summary: formData.summary?.trim() || null,
      access_level: "public",

      // 👇 CLAVE: evitar NaN
      news_category_id:
        formData.post_type === "news"
          ? Number(formData.news_category_id)
          : null,

      category_id:
        formData.post_type === "post"
          ? Number(formData.category_id)
          : null
    };

    console.log("📦 Payload enviado:", payload);

    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/news`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${user?.token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.message || "Error al crear");
    }

    setMensaje({ tipo: "success", texto: "Creado correctamente" });
    setFormData({
      title: "",
      summary: "",
      content: "",
      post_type: "news",
      news_category_id: "1",
      category_id: "",
      post_status: "draft"
    });

    fetchNoticias();

  } catch (error) {
    console.error("❌ Error:", error);
    setMensaje({ tipo: "error", texto: error.message });
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="admin-page-container">
      <div className="admin-header-flex">
        <div>
          <h1 className="admin-title">Gestión de Contenido</h1>
          <p className="admin-subtitle">Noticias y Publicaciones del sistema.</p>
        </div>
        <button 
          className={view === "list" ? "btn-primary" : "btn-secondary"} 
          onClick={() => setView(view === "list" ? "create" : "list")}
        >
          {view === "list" ? <><Plus size={18} /> Nuevo Registro</> : <><List size={18} /> Ver Lista</>}
        </button>
      </div>

      {view === "list" && (
        <div className="admin-card fade-in">
          {loadingList ? (
            <div className="loading-state"><Loader2 className="spin" /> Cargando...</div>
          ) : noticias.length > 0 ? (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Título</th>
                    <th>Tipo</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {noticias.map((n) => (
                    <tr key={n.news_post_id}>
                      <td className="font-medium">{n.title}</td>
                      <td><span className={`type-tag ${n.post_type}`}>{n.post_type === 'news' ? 'Noticia' : 'Publicación'}</span></td>
                      <td><span className={`badge ${n.post_status}`}>{n.post_status}</span></td>
                      <td className="actions-cell">
                        <button className="btn-icon"><Edit size={16} /></button>
                        <button className="btn-icon delete"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <FileText size={48} className="empty-icon" />
              <h3>No hay registros</h3>
              <button className="btn-primary mt-4" onClick={() => setView("create")}>Empezar ahora</button>
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
                  <select name="post_type" value={formData.post_type} onChange={handleInputChange}>
                    <option value="news">Noticia (Informativa)</option>
                    <option value="post">Publicación (General)</option>
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
                  <label>Estado</label>
                  <select name="post_status" value={formData.post_status} onChange={handleInputChange}>
                    <option value="draft">Borrador</option>
                    <option value="published">Publicado</option>
                  </select>
                </div>

                {/* Switch dinámico de categorías según el tipo */}
                {formData.post_type === "news" ? (
                  <div className="form-group">
                    <label>Categoría de Noticia</label>
                    <select name="news_category_id" value={formData.news_category_id} onChange={handleInputChange} required>
                      <option value="1">Datasets</option>
                      <option value="2">Indicadores</option>
                      <option value="3">Eventos</option>
                      <option value="4">Plataformas</option>
                    </select>
                  </div>
                ) : (
                  <div className="form-group">
                    <label>ID de Categoría General</label>
                    <input type="number" name="category_id" value={formData.category_id} onChange={handleInputChange} placeholder="Ej: 10" required />
                  </div>
                )}
              </div>
            </div>

            {mensaje.texto && <div className={`form-message ${mensaje.tipo}`}>{mensaje.texto}</div>}

            <div className="form-actions">
              <button type="button" className="btn-ghost" onClick={() => setView("list")}><X size={18} /> Cancelar</button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? <Loader2 size={18} className="spin" /> : <Save size={18} />} Guardar {formData.post_type === 'news' ? 'Noticia' : 'Publicación'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default NoticiasAdmin;