import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, X, CheckCircle, ChevronDown } from "lucide-react";
import "../../Styles/Pages_styles/Admin/CrearDataset.css";
import { useAuth } from "../../Context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function CrearDatasetUsuario() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const [categories, setCategories] = useState([]);
  const [licenses, setLicenses] = useState([]);
  const [instituciones, setInstituciones] = useState([]);
  const [tagsList, setTagsList] = useState([]);

  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    description: "",
    category_id: "",
    license_id: "",
    institution_id: "",
    access_level: "public",
    creation_date: new Date().toISOString().split("T")[0],
    temporal_coverage_start: "",
    temporal_coverage_end: "",
    geographic_coverage: "",
    update_frequency: "",
    source_url: "",
    dataset_status: "pending_validation",
    message: "",
    tags: [],
  });

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [tagsOpen, setTagsOpen] = useState(false);
  const isDraft = formData.dataset_status === "draft";

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const catRes = await fetch(`${API_URL}/api/categories`);
        if (catRes.ok) setCategories((await catRes.json()).data || []);

        const licRes = await fetch(`${API_URL}/api/licenses`);
        if (licRes.ok) setLicenses((await licRes.json()).data || []);

        const instRes = await fetch(`${API_URL}/api/public/instituciones`);
        if (instRes.ok) setInstituciones((await instRes.json()).instituciones || []);

        const tagsRes = await fetch(`${API_URL}/api/tags`);
        if (tagsRes.ok) setTagsList((await tagsRes.json()).data || []);
      } catch (error) {
        console.error("Error cargando opciones:", error);
      }
    };
    fetchOptions();
  }, [user.token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddTag = (e) => {
    const tagId = Number(e.target.value);
    if (!tagId) return;
    setFormData((prev) => {
      if (prev.tags.length >= 5) { alert("Máximo 5 etiquetas permitidas."); return prev; }
      if (prev.tags.includes(tagId)) return prev;
      return { ...prev, tags: [...prev.tags, tagId] };
    });
  };

  const handleRemoveTag = (tagId) => {
    setFormData((prev) => ({ ...prev, tags: prev.tags.filter((id) => id !== tagId) }));
  };

  const handleFileChange = (e) => setSelectedFiles(Array.from(e.target.files));
  const removeFile = (indexToRemove) =>
    setSelectedFiles((files) => files.filter((_, index) => index !== indexToRemove));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return alert("Debes subir al menos un archivo.");

    setIsSubmitting(true);

    try {
      const uploadedFilesData = [];

      for (const file of selectedFiles) {
        const presignedRes = await fetch(`${API_URL}/api/upload/presigned-url/user`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({ fileName: file.name, contentType: file.type }),
        });

        if (!presignedRes.ok) throw new Error("Error obteniendo URL de subida");
        const { uploadUrl, fileUrl, storageKey } = await presignedRes.json();

        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!uploadRes.ok) throw new Error(`Error subiendo el archivo ${file.name}`);

        uploadedFilesData.push({
          storage_key: storageKey,
          file_url: fileUrl,
          display_name: file.name,
          file_format: file.name.split(".").pop().toLowerCase(),
          mime_type: file.type,
          file_size_bytes: file.size,
          file_role: "source",
          is_primary: uploadedFilesData.length === 0,
        });
      }

      const payload = {
        ...formData,
        category_id: Number(formData.category_id),
        license_id: Number(formData.license_id),
        institution_id: formData.institution_id ? Number(formData.institution_id) : null,
        source_url: formData.source_url?.trim() !== "" ? formData.source_url : null,
        temporal_coverage_start:
          formData.temporal_coverage_start !== "" ? formData.temporal_coverage_start : null,
        temporal_coverage_end:
          formData.temporal_coverage_end !== "" ? formData.temporal_coverage_end : null,
        geographic_coverage:
          formData.geographic_coverage?.trim() !== "" ? formData.geographic_coverage : null,
        update_frequency: formData.update_frequency !== "" ? formData.update_frequency : null,
        tags: formData.tags.map(Number),
        files: uploadedFilesData,
        message: formData.dataset_status === "draft" ? null : formData.message,
      };

      const res = await fetch(`${API_URL}/api/datasets/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        let errorMsg = "Error del servidor al procesar la solicitud";
        if (Array.isArray(err.message)) errorMsg = err.message.map((e) => e.message).join(", ");
        else if (err.message) errorMsg = err.message;
        throw new Error(errorMsg);
      }

      const successMsg =
        formData.dataset_status === "draft"
          ? "¡Borrador guardado exitosamente en tu área de trabajo!"
          : "¡Tu propuesta de Dataset ha sido enviada a revisión con éxito!";

      alert(successMsg);
      navigate(-1);
    } catch (error) {
      console.error(error);
      alert(error.message || "Ocurrió un error al procesar la solicitud.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="crear-dataset-container">

      {/* ── Header ── */}
      <div className="crear-header">
        <button type="button" onClick={() => navigate(-1)} className="btn-back">
          ← Volver
        </button>
        <div className="crear-header__text">
          <h1>Proponer Nuevo Dataset</h1>
          <p>Comparte datos de valor público con la comunidad</p>
        </div>
      </div>

      {/* ── Indicador de pasos ── */}
      <div className="step-indicator">
        <div className={`step-item${step >= 1 ? " step-item--active" : ""}${step > 1 ? " step-item--done" : ""}`}>
          <div className="step-item__circle">
            {step > 1 ? <CheckCircle size={16} /> : "1"}
          </div>
          <span className="step-item__label">Información</span>
        </div>
        <div className={`step-line${step > 1 ? " step-line--done" : ""}`} />
        <div className={`step-item${step >= 2 ? " step-item--active" : ""}`}>
          <div className="step-item__circle">2</div>
          <span className="step-item__label">Archivos</span>
        </div>
      </div>

      <form onSubmit={step === 1 ? (e) => { e.preventDefault(); if (formData.tags.length === 0) return alert("Debes seleccionar al menos 1 etiqueta."); setStep(2); } : handleSubmit}>

        {/* ══════════════════ PASO 1 ══════════════════ */}
        <div className={step !== 1 ? "d-none" : ""}>

          {/* Sección: Información básica */}
          <div className="form-section">
            <h3 className="form-section__title">Información básica</h3>

            <div className="form-group">
              <label>
                Título del Dataset <span className="req">*</span>
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="form-control"
                placeholder="Ej: Censo Nacional de Población 2024"
              />
            </div>

            <div className="form-group">
              <label>
                Resumen corto <span className="req">*</span>
                <span className="form-hint">Máx. 500 caracteres</span>
              </label>
              <textarea
                name="summary"
                required
                maxLength="500"
                value={formData.summary}
                onChange={handleChange}
                className="form-control textarea-short"
                placeholder="Descripción breve del contenido y propósito del dataset..."
              />
            </div>

            <div className="form-group">
              <label>
                Descripción completa <span className="req">*</span>
              </label>
              <textarea
                name="description"
                required
                value={formData.description}
                onChange={handleChange}
                className="form-control textarea-long"
                placeholder="Descripción detallada: metodología, variables incluidas, fuente de los datos..."
              />
            </div>
          </div>

          {/* Sección: Clasificación */}
          <div className="form-section">
            <h3 className="form-section__title">Clasificación</h3>

            <div className="form-row">
              <div className="form-col form-group">
                <label>
                  Categoría <span className="req">*</span>
                </label>
                <select
                  name="category_id"
                  required
                  value={formData.category_id}
                  onChange={handleChange}
                  className="form-control"
                >
                  <option value="">Seleccione...</option>
                  {categories.map((c) => (
                    <option key={c.category_id} value={c.category_id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-col form-group">
                <label>
                  Licencia <span className="req">*</span>
                </label>
                <select
                  name="license_id"
                  required
                  value={formData.license_id}
                  onChange={handleChange}
                  className="form-control"
                >
                  <option value="">Seleccione...</option>
                  {licenses.map((l) => (
                    <option key={l.license_id} value={l.license_id}>{l.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-col form-group">
                <label>Institución responsable</label>
                <select
                  name="institution_id"
                  value={formData.institution_id}
                  onChange={handleChange}
                  className="form-control"
                >
                  <option value="">Seleccione...</option>
                  {instituciones.map((inst) => (
                    <option key={inst.institution_id} value={inst.institution_id}>
                      {inst.legal_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-col form-group">
                <label>Nivel de acceso solicitado</label>
                <select
                  name="access_level"
                  value={formData.access_level}
                  onChange={handleChange}
                  className="form-control"
                >
                  <option value="public">Público (cualquiera)</option>
                  <option value="internal">Interno (registrados)</option>
                </select>
              </div>
            </div>

            <div className="accordion-section">
              <button
                type="button"
                className="accordion-header"
                onClick={() => setTagsOpen((o) => !o)}
              >
                <span>
                  Etiquetas <span className="req">*</span>
                </span>
                <span className="accordion-meta">
                  {formData.tags.length > 0
                    ? `${formData.tags.length}/5 seleccionada${formData.tags.length > 1 ? "s" : ""}`
                    : "Ninguna seleccionada"}
                </span>
                <ChevronDown
                  size={16}
                  className={`accordion-chevron${tagsOpen ? " accordion-chevron--open" : ""}`}
                />
              </button>

              {tagsOpen && (
                <div className="accordion-body">
                  <select
                    className="form-control"
                    value=""
                    onChange={handleAddTag}
                    disabled={formData.tags.length >= 5}
                  >
                    <option value="">
                      {formData.tags.length >= 5
                        ? "Límite de 5 alcanzado"
                        : "-- Selecciona una etiqueta --"}
                    </option>
                    {tagsList
                      .filter((tag) => !formData.tags.includes(tag.tag_id))
                      .map((tag) => (
                        <option key={tag.tag_id} value={tag.tag_id}>
                          {tag.name}
                        </option>
                      ))}
                  </select>

                  {formData.tags.length > 0 && (
                    <div className="tags-chips">
                      {formData.tags.map((tagId) => {
                        const tagObj = tagsList.find(
                          (t) => String(t.tag_id) === String(tagId)
                        );
                        return (
                          <span key={tagId} className="tag-chip tag-chip--selected">
                            {tagObj ? tagObj.name : `Etiqueta #${tagId}`}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tagId)}
                              className="tag-chip__remove"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {formData.tags.length === 0 && (
                    <p className="tags-error">Selecciona al menos 1 etiqueta para continuar.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sección: Cobertura y fechas */}
          <div className="form-section">
            <h3 className="form-section__title">Cobertura y fechas</h3>

            <div className="form-row">
              <div className="form-col form-group">
                <label>
                  Fecha de creación de los datos <span className="req">*</span>
                </label>
                <input
                  type="date"
                  name="creation_date"
                  required
                  value={formData.creation_date}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>
              <div className="form-col form-group">
                <label>Frecuencia de actualización</label>
                <select
                  name="update_frequency"
                  value={formData.update_frequency}
                  onChange={handleChange}
                  className="form-control"
                >
                  <option value="">No definida</option>
                  <option value="Anual">Anual</option>
                  <option value="Semestral">Semestral</option>
                  <option value="Trimestral">Trimestral</option>
                  <option value="Mensual">Mensual</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-col form-group">
                <label>Cobertura temporal (inicio)</label>
                <input
                  type="date"
                  name="temporal_coverage_start"
                  value={formData.temporal_coverage_start}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>
              <div className="form-col form-group">
                <label>Cobertura temporal (término)</label>
                <input
                  type="date"
                  name="temporal_coverage_end"
                  value={formData.temporal_coverage_end}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-col form-group">
                <label>Cobertura geográfica</label>
                <input
                  type="text"
                  name="geographic_coverage"
                  placeholder="Ej: Chile, Regional..."
                  value={formData.geographic_coverage}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>
              <div className="form-col form-group">
                <label>URL de la organización / fuente</label>
                <input
                  type="url"
                  name="source_url"
                  placeholder="https://ejemplo.org"
                  value={formData.source_url}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>
            </div>
          </div>

          <div className="form-actions form-actions--right">
            <button type="submit" className="btn-primary btn-primary--validation">
              Continuar a Archivos →
            </button>
          </div>
        </div>

        {/* ══════════════════ PASO 2 ══════════════════ */}
        <div className={step !== 2 ? "d-none" : ""}>

          <div className="form-section">
            <h3 className="form-section__title">Sube los archivos del dataset</h3>

            <div className="file-drop-area">
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                id="file-upload"
                className="d-none"
              />
              <Upload size={40} strokeWidth={1.5} className="file-drop-area__icon" />
              <p className="file-drop-area__title">Arrastra tus archivos aquí</p>
              <p className="file-drop-area__subtitle">o</p>
              <label htmlFor="file-upload" className="file-upload-label">
                Seleccionar archivos
              </label>
              <p className="file-drop-area__hint">CSV, XLSX, JSON, PDF y más</p>
            </div>

            {selectedFiles.length > 0 && (
              <div className="file-list">
                <p className="file-list__header">
                  {selectedFiles.length} archivo{selectedFiles.length > 1 ? "s" : ""} seleccionado
                  {selectedFiles.length > 1 ? "s" : ""}
                </p>
                {selectedFiles.map((f, i) => (
                  <div key={i} className="file-item">
                    <FileText size={18} className="file-item__icon" />
                    <div className="file-item__info">
                      <span className="file-item__name">{f.name}</span>
                      <span className="file-item__size">
                        {(f.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    <span className="file-item__badge">
                      {f.name.split(".").pop().toUpperCase()}
                    </span>
                    <button type="button" onClick={() => removeFile(i)} className="btn-remove-file">
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => setStep(1)} className="btn-secondary">
              ← Atrás
            </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedFiles.length === 0}
              className="btn-primary btn-primary--validation"
            >
              {isSubmitting ? "Procesando..." : "📤 Enviar a Revisión"}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}

export default CrearDatasetUsuario;
