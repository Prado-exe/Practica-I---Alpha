import { useEffect, useState, useRef } from "react";
import CanView from "../../Components/Common/CanView";
import { useAuth } from "../../Context/AuthContext";
import "../../Styles/Pages_styles/Admin/GestionInstituciones.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function GestionInstituciones() {
  const { user } = useAuth();
  const [instituciones, setInstituciones] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para búsqueda y filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  // Estados para el Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const fileInputRef = useRef(null);

  // Estados para el Modal de Detalles
  const [modalDetallesOpen, setModalDetallesOpen] = useState(false);
  const [institucionDetalle, setInstitucionDetalle] = useState(null);

  // Función para abrir el modal de detalles
  const abrirModalDetalles = (inst) => {
    setInstitucionDetalle(inst);
    setModalDetallesOpen(true);
  };

  const [formData, setFormData] = useState({
    id: null,
    legal_name: "",
    short_name: "",
    institution_type: "",
    country_name: "",
    description: "",
    data_role: "",
    access_level: "public",
    institution_status: "active",
    image: null, 
    imageUrlPreview: "",
  });

  useEffect(() => {
    if (user?.token) {
      fetchInstituciones();
    }
  }, [user?.token]);

  // 1. Obtener Instituciones de PostgreSQL
  const fetchInstituciones = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/instituciones`, {
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInstituciones(data.instituciones || []);
      }
    } catch (error) {
      console.error("Error obteniendo instituciones:", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Previsualizar la imagen antes de subirla
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: file, imageUrlPreview: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  // 3. FLUJO DE GUARDADO (MinIO S3 + PostgreSQL)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!modoEdicion && !formData.image) {
      alert("La imagen de la institución es obligatoria.");
      return;
    }

    try {
      let finalImageUrl = formData.imageUrlPreview;
      let fileDataPayload = null;

      // PASO A: Si el usuario seleccionó una imagen nueva, subirla a S3/MinIO
      if (formData.image instanceof File) {
        // Pedimos la URL Prefirmada
        const presignedRes = await fetch(`${API_URL}/api/upload/presigned-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${user.token}` },
          body: JSON.stringify({ fileName: formData.image.name, contentType: formData.image.type })
        });

        if (!presignedRes.ok) throw new Error("Error obteniendo autorización para subir archivo.");
        const { uploadUrl, fileUrl, storageKey } = await presignedRes.json();

        // Subimos el archivo físicamente
        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          body: formData.image,
          headers: { "Content-Type": formData.image.type }
        });

        if (!uploadRes.ok) throw new Error("Error subiendo la imagen al servidor de almacenamiento.");
        
        finalImageUrl = fileUrl;
        fileDataPayload = {
          storage_key: storageKey,
          file_url: finalImageUrl,
          mime_type: formData.image.type,
          file_size_bytes: formData.image.size
        };
      }

      // PASO B: Guardar los datos en PostgreSQL
      const payload = {
        institution: {
          legal_name: formData.legal_name,
          short_name: formData.short_name,
          institution_type: formData.institution_type,
          country_name: formData.country_name,
          description: formData.description,
          data_role: formData.data_role,
          access_level: formData.access_level,
          institution_status: formData.institution_status
        },
        file: fileDataPayload // Si no hay imagen nueva, esto viaja como null
      };

      const url = modoEdicion ? `${API_URL}/api/instituciones/${formData.id}` : `${API_URL}/api/instituciones`;
      const method = modoEdicion ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${user.token}` },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert(`Institución ${modoEdicion ? "actualizada" : "creada"} correctamente`);
        setModalOpen(false);
        fetchInstituciones(); 
      } else {
        const err = await res.json();
        alert(`Error del servidor: ${err.message}`);
      }

    } catch (error) {
      console.error("Error en guardado:", error);
      alert("Ocurrió un error al procesar la solicitud.");
    }
  };

  // 4. Eliminar Institución
  const handleEliminar = async (id, nombre) => {
    if(!window.confirm(`¿Estás seguro de que deseas eliminar permanentemente a ${nombre}?`)) return;
    
    try {
      const res = await fetch(`${API_URL}/api/instituciones/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if(res.ok) {
        fetchInstituciones();
      } else {
        const err = await res.json();
        alert(`Error: ${err.message}`);
      }
    } catch(error) {
      console.error(error);
    }
  }

  // 5. Manejo del Modal
  const abrirModalCrear = () => {
    setModoEdicion(false);
    setFormData({ id: null, legal_name: "", short_name: "", institution_type: "", country_name: "", description: "", data_role: "", access_level: "public", institution_status: "active", image: null, imageUrlPreview: "" });
    if (fileInputRef.current) fileInputRef.current.value = "";
    setModalOpen(true);
  };

  const abrirModalEditar = (inst) => {
    setModoEdicion(true);
    setFormData({
      id: inst.institution_id,
      legal_name: inst.legal_name,
      short_name: inst.short_name || "",
      institution_type: inst.institution_type,
      country_name: inst.country_name,
      description: inst.description,
      data_role: inst.data_role,
      access_level: inst.access_level,
      institution_status: inst.institution_status,
      image: null, 
      imageUrlPreview: inst.logo_url 
    });
    setModalOpen(true);
  };

  // Filtros Locales
  const institucionesFiltradas = instituciones.filter(inst => 
    inst.legal_name.toLowerCase().includes(busqueda.toLowerCase()) &&
    (filtroTipo === "" || inst.institution_type === filtroTipo) &&
    (filtroEstado === "" || inst.institution_status === filtroEstado)
  );

  return (
    <div style={{ padding: "20px", color: "black", background: "white", minHeight: "100vh" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "24px" }}>Instituciones</h1>
          <p style={{ margin: "5px 0 0 0", color: "#666" }}>Administra entidades responsables de datasets.</p>
        </div>
        <CanView requiredPermission="admin_general.manage">
          <button onClick={abrirModalCrear} style={{ background: "#2196F3", color: "white", border: "none", padding: "10px 15px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
            + Nueva Institución
          </button>
        </CanView>
      </div>

      {/* FILTROS */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <input type="text" placeholder="Buscar por nombre..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} style={{ flex: 1, padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }} />
        
        <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}>
          <option value="">Tipo (Cualquier)</option>
          <option value="Academica">Académica</option>
          <option value="Institución pública">Institución pública</option>
          <option value="Privada">Privada</option>
          <option value="ONG">ONG</option>
        </select>
        
        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}>
          <option value="">Estado (Cualquier)</option>
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
        </select>
        
        <button onClick={() => { setBusqueda(""); setFiltroTipo(""); setFiltroEstado(""); }} style={{ background: "#dc3545", color: "white", border: "none", padding: "8px 15px", borderRadius: "4px", cursor: "pointer" }}>Limpiar</button>
      </div>

      {/* TABLA */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        
        {/* Cabecera sin el logo */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1.5fr 1fr 1fr 1.5fr", gap: "10px", fontWeight: "bold", padding: "15px 10px", background: "#1976d2", color: "white", borderRadius: "4px" }}>
          <span>Nombre</span>
          <span>Sigla</span>
          <span>Tipo</span>
          <span>Datasets</span>
          <span>Estado</span>
          <span>Acciones</span>
        </div>

        {loading ? <p>Cargando datos desde el servidor...</p> : 
         institucionesFiltradas.length === 0 ? <p>No hay instituciones registradas.</p> :
         institucionesFiltradas.map((inst) => (
          <div key={inst.institution_id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1.5fr 1fr 1fr 1.5fr", gap: "10px", alignItems: "center", padding: "10px", borderBottom: "1px solid #eee" }}>
            
            <span>{inst.legal_name}</span>
            <span>{inst.short_name || "-"}</span>
            <span>{inst.institution_type}</span>
            <span>-</span>
            <span style={{ color: inst.institution_status === 'active' ? 'white' : 'black', background: inst.institution_status === 'active' ? '#28a745' : '#ffc107', padding: "3px 8px", borderRadius: "12px", fontSize: "12px", textAlign: "center", width: "fit-content" }}>
              {inst.institution_status === 'active' ? 'Activo' : 'Inactivo'}
            </span>

            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => abrirModalDetalles(inst)} style={{ background: "transparent", border: "none", color: "#6c757d", cursor: "pointer", fontSize: "16px" }} title="Ver detalles">👁️</button>
              <button onClick={() => abrirModalEditar(inst)} style={{ background: "transparent", border: "none", color: "#2196F3", cursor: "pointer", fontSize: "16px" }} title="Editar">✏️</button>
              <button onClick={() => handleEliminar(inst.institution_id, inst.legal_name)} style={{ background: "transparent", border: "none", color: "#dc3545", cursor: "pointer", fontSize: "16px" }} title="Eliminar">🗑️</button>
            </div>
            
          </div>
        ))}
      </div>

      {/* MODAL */}
      {modalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ background: "white", padding: "25px", borderRadius: "8px", width: "550px", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ margin: "0 0 20px 0", borderBottom: "1px solid #ccc", paddingBottom: "10px" }}>{modoEdicion ? "Editar Institución" : "Crear Nueva Institución"}</h2>
            
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              
              <label><strong>Nombre oficial *</strong></label>
              <input type="text" value={formData.legal_name} onChange={e => setFormData({...formData, legal_name: e.target.value})} required style={{ padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }} />

              <label><strong>Sigla / Acrónimo</strong></label>
              <input type="text" value={formData.short_name} onChange={e => setFormData({...formData, short_name: e.target.value.toUpperCase()})} style={{ padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }} />

              <div style={{ display: "flex", gap: "15px", alignItems: "center", background: "#f9f9f9", padding: "10px", borderRadius: "4px", border: "1px dashed #ccc" }}>
                {formData.imageUrlPreview ? (
                  <img src={formData.imageUrlPreview} alt="Logo" style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "4px" }} />
                ) : (
                  <div style={{ width: "80px", height: "80px", background: "#eee", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", textAlign: "center", borderRadius: "4px" }}>Sin imagen</div>
                )}
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Logo Institucional {!modoEdicion && "*"}</label>
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} required={!modoEdicion} />
                  <small style={{ display: "block", color: "#666", marginTop: "5px" }}>Formatos: JPG, PNG. Máx: 2MB.</small>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <label><strong>Tipo de Institución *</strong></label>
                  <select value={formData.institution_type} onChange={e => setFormData({...formData, institution_type: e.target.value})} required style={{ padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}>
                    <option value="" disabled>Seleccione el tipo</option>
                    <option value="Academica">Académica</option>
                    <option value="Institución pública">Institución pública</option>
                    <option value="Privada">Privada</option>
                    <option value="ONG">ONG</option>
                  </select>
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <label><strong>País *</strong></label>
                  <input type="text" value={formData.country_name} onChange={e => setFormData({...formData, country_name: e.target.value})} required placeholder="Ej: Chile" style={{ padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }} />
                </div>
              </div>

              <label><strong>Descripción Institucional *</strong></label>
              <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required maxLength="1000" rows="3" style={{ padding: "8px", border: "1px solid #ccc", borderRadius: "4px", resize: "vertical" }} />

              <label><strong>Rol respecto a los datos *</strong></label>
              <select value={formData.data_role} onChange={e => setFormData({...formData, data_role: e.target.value})} required style={{ padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}>
                <option value="" disabled>Seleccione el rol</option>
                <option value="Generador">Generador</option>
                <option value="Distribuidor">Distribuidor</option>
                <option value="Administrador">Administrador</option>
              </select>

              <div style={{ display: "flex", gap: "20px", background: "#f5f5f5", padding: "10px", borderRadius: "4px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>Nivel de acceso</label>
                  <label style={{ marginRight: "10px" }}><input type="radio" name="access_level" value="public" checked={formData.access_level === "public"} onChange={e => setFormData({...formData, access_level: e.target.value})} /> Público</label>
                  <label><input type="radio" name="access_level" value="internal" checked={formData.access_level === "internal"} onChange={e => setFormData({...formData, access_level: e.target.value})} /> Privado (Interno)</label>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>Estado</label>
                  <label style={{ marginRight: "10px" }}><input type="radio" name="institution_status" value="active" checked={formData.institution_status === "active"} onChange={e => setFormData({...formData, institution_status: e.target.value})} /> Activo</label>
                  <label><input type="radio" name="institution_status" value="inactive" checked={formData.institution_status === "inactive"} onChange={e => setFormData({...formData, institution_status: e.target.value})} /> Inactivo</label>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button type="button" onClick={() => setModalOpen(false)} style={{ background: "#ccc", color: "black", padding: "10px 15px", border: "none", borderRadius: "4px", cursor: "pointer" }}>Cancelar</button>
                <button type="submit" style={{ background: "#2196F3", color: "white", padding: "10px 15px", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Guardar y continuar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE DETALLES (SOLO LECTURA) */}
      {modalDetallesOpen && institucionDetalle && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ background: "white", padding: "20px 30px", borderRadius: "8px", width: "500px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 4px 20px rgba(0,0,0,0.15)", fontFamily: "sans-serif" }}>
            
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", paddingBottom: "10px", marginBottom: "20px" }}>
              <h2 style={{ margin: 0, fontSize: "16px", color: "#333", fontWeight: "bold" }}>Detalle de la Institucion</h2>
              <button onClick={() => setModalDetallesOpen(false)} style={{ background: "transparent", border: "none", fontSize: "18px", cursor: "pointer", color: "#999" }}>✕</button>
            </div>

            {/* Logo Centrado */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
              <div style={{ width: "90px", height: "90px", border: "1px solid #ddd", borderRadius: "4px", padding: "5px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                <img 
                  src={institucionDetalle.logo_url} 
                  alt={institucionDetalle.short_name} 
                  style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} 
                />
              </div>
            </div>

            {/* Lista de Campos (Estilo Formulario) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              
              <div style={{ display: "flex", alignItems: "center", fontSize: "13px" }}>
                <div style={{ width: "130px", textAlign: "right", paddingRight: "10px", color: "#555" }}>Nombre oficial :</div>
                <div style={{ flex: 1, padding: "6px 10px", border: "1px solid #ccc", borderRadius: "2px", background: "#fff", color: "#333" }}>{institucionDetalle.legal_name}</div>
              </div>

              <div style={{ display: "flex", alignItems: "center", fontSize: "13px" }}>
                <div style={{ width: "130px", textAlign: "right", paddingRight: "10px", color: "#555" }}>Sigla/Acrónimo :</div>
                <div style={{ flex: 1, padding: "6px 10px", border: "1px solid #ccc", borderRadius: "2px", background: "#fff", color: "#333" }}>{institucionDetalle.short_name || "-"}</div>
              </div>

              <div style={{ display: "flex", alignItems: "center", fontSize: "13px" }}>
                <div style={{ width: "130px", textAlign: "right", paddingRight: "10px", color: "#555" }}>Tipo :</div>
                <div style={{ flex: 1, padding: "6px 10px", border: "1px solid #ccc", borderRadius: "2px", background: "#fff", color: "#333" }}>{institucionDetalle.institution_type}</div>
              </div>

              <div style={{ display: "flex", alignItems: "center", fontSize: "13px" }}>
                <div style={{ width: "130px", textAlign: "right", paddingRight: "10px", color: "#555" }}>Pais :</div>
                <div style={{ flex: 1, padding: "6px 10px", border: "1px solid #ccc", borderRadius: "2px", background: "#fff", color: "#333" }}>{institucionDetalle.country_name}</div>
              </div>

              <div style={{ display: "flex", alignItems: "center", fontSize: "13px" }}>
                <div style={{ width: "130px", textAlign: "right", paddingRight: "10px", color: "#555" }}>Dependencia :</div>
                <div style={{ flex: 1, padding: "6px 10px", border: "1px solid #ccc", borderRadius: "2px", background: "#fff", color: "#333" }}>No Aplica</div>
              </div>

              <div style={{ display: "flex", alignItems: "center", fontSize: "13px" }}>
                <div style={{ width: "130px", textAlign: "right", paddingRight: "10px", color: "#555" }}>Área temática :</div>
                <div style={{ flex: 1, padding: "6px 10px", border: "1px solid #ccc", borderRadius: "2px", background: "#fff", color: "#333" }}>{institucionDetalle.main_thematic_area || "-"}</div>
              </div>

              <div style={{ display: "flex", alignItems: "center", fontSize: "13px" }}>
                <div style={{ width: "130px", textAlign: "right", paddingRight: "10px", color: "#555" }}>Rol :</div>
                <div style={{ flex: 1, padding: "6px 10px", border: "1px solid #ccc", borderRadius: "2px", background: "#fff", color: "#333" }}>{institucionDetalle.data_role}</div>
              </div>

              <div style={{ display: "flex", alignItems: "center", fontSize: "13px" }}>
                <div style={{ width: "130px", textAlign: "right", paddingRight: "10px", color: "#555" }}>Licencia de uso :</div>
                <div style={{ flex: 1, padding: "6px 10px", border: "1px solid #ccc", borderRadius: "2px", background: "#fff", color: "#333" }}>{institucionDetalle.usage_license || "-"}</div>
              </div>

            </div>

            {/* Descripción */}
            <div style={{ marginTop: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", color: "#555", marginBottom: "5px", marginLeft: "5px" }}>Descripcion</label>
              <div style={{ padding: "12px", border: "1px solid #ccc", borderRadius: "2px", fontSize: "13px", color: "#333", background: "#fff", minHeight: "100px", maxHeight: "180px", overflowY: "auto", whiteSpace: "pre-wrap", lineHeight: "1.5" }}>
                {institucionDetalle.description}
              </div>
            </div>

          </div>
        </div>
      )}


    </div>
  );
}

export default GestionInstituciones;