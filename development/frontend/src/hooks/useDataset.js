import { useState, useCallback } from "react";
import Papa from "papaparse";
import { mapColumns } from "../utils/columnMapper";

const API_URL = import.meta.env.VITE_API_URL || "http://3.139.202.192:3000";

const INITIAL = {
  data: [], columns: [], mapping: null, metadata: null, loading: false, error: null,
};

export function useDataset() {
  const [state, setState] = useState(INITIAL);

  const loadDataset = useCallback(async (manifest) => {
    setState(s => ({ ...s, loading: true, error: null, data: [], columns: [], mapping: null, metadata: null }));

    try {
      if (!manifest.url) throw new Error("La URL del archivo CSV está vacía.");

      console.log(`🚀 [RAYOS X] Iniciando descarga desde: ${manifest.url}`);
      
      const resp = await fetch(manifest.url);
      
      if (!resp.ok) {
        throw new Error(`Error de red HTTP ${resp.status}: No se pudo acceder al archivo.`);
      }

      const text = await resp.text();
      
      console.log("📦 [RAYOS X] Contenido real descargado (Primeros 300 caracteres):");
      console.log(text.substring(0, 300));

      if (text.trim().startsWith("<?xml") || text.trim().includes("<Error>")) {
        throw new Error("AWS S3 bloqueó la descarga. Verifica que el Bucket sea PÚBLICO y que la ruta sea correcta.");
      }
      
      if (text.trim().startsWith("<!DOCTYPE html>") || text.trim().startsWith("<html")) {
        throw new Error("El servidor devolvió una página web (HTML) en lugar de un CSV.");
      }

      if (text.trim() === "") {
        throw new Error("El archivo se descargó, pero está completamente en blanco.");
      }

      const { data, meta, errors } = Papa.parse(text, {
        header: true, skipEmptyLines: true, dynamicTyping: true,
      });

      if (errors.length > 0 && data.length === 0) {
        throw new Error("El archivo no pudo procesarse: " + errors[0].message);
      }

      const columns = meta.fields ?? [];
      
      if (columns.length === 0) {
         throw new Error("No se detectaron columnas. Asegúrate de que sea un CSV válido.");
      }

      const mapping = mapColumns(columns, data);

      // 👇 CORRECCIÓN: Usamos el objeto 'manifest' de forma segura
      const lastUpdatedDate = manifest.updated_at || manifest.created_at || new Date().toISOString();
      const fileSize = manifest.files && manifest.files[0] ? (manifest.files[0].file_size_bytes / 1024).toFixed(1) : "N/A";

      setState({
        data, columns, mapping,
        metadata: {
          name:        manifest.name || "Dataset",
          file:        manifest.file || "archivo.csv",
          format:      manifest.format || "CSV",
          category:    manifest.category || "Sin categoría",
          description: manifest.description || "",
          lastUpdated: new Date(lastUpdatedDate).toLocaleDateString("es-CL"),
          rows:        data.length,
          cols:        columns.length,
          sizeKb:      fileSize,
        },
        loading: false, error: null,
      });
    } catch (err) {
      console.error("❌ [RAYOS X] El hook falló:", err);
      setState({
        ...INITIAL,
        loading: false, 
        error: err.message ?? "Error desconocido." 
      });
    }
  }, []);

  const reset = useCallback(() => setState(INITIAL), []);

  // 👇 CORRECCIÓN: Devolvemos 'loadDataset' que es el nombre real de la función
  return { ...state, loadDataset, reset };
}