<<<<<<< HEAD
/**
 * ============================================================================
 * MÓDULO: Repositorio de Etiquetas/Tags (tags.repository.ts)
 * * PROPÓSITO: Gestionar el acceso directo a la base de datos para la tabla 
 * de etiquetas (tags) del sistema.
 * * RESPONSABILIDAD: Ejecutar consultas SQL optimizadas para recuperar la 
 * colección de palabras clave utilizadas para describir y clasificar recursos.
 * * DECISIONES DE DISEÑO / SUPUESTOS:
 * - Optimización de Red: Se solicitan únicamente las columnas estrictamente 
 * esenciales (`tag_id`, `name`) excluyendo fechas de auditoría u otros metadatos. 
 * Esto minimiza el tamaño del payload de la consulta, asumiendo que el principal 
 * consumidor es un componente UI de selección múltiple (dropdown/typeahead) que 
 * requiere una carga rápida y ligera.
 * ============================================================================
 */
import { pool } from "../config/db";

/**
 * Descripción: Extrae el catálogo completo de etiquetas (tags) registradas en la base de datos.
 * POR QUÉ: Delega la responsabilidad del ordenamiento alfabético al motor de PostgreSQL (`ORDER BY name ASC`) para aprovechar sus algoritmos e índices, evitando procesamientos costosos en la memoria de Node.js o en el navegador del cliente. A diferencia de otras entidades (como categorías o roles), no se implementa un filtro de borrado lógico (`is_active`), asumiendo que el diseño de las etiquetas es global o que su gestión se basa en borrado físico (Hard Delete).
 * @param {void} No requiere parámetros de entrada.
 * @return {Promise<Array<{tag_id: number, name: string}>>} Arreglo ordenado con los identificadores y nombres de todas las etiquetas.
 * @throws {Ninguna} Errores de ejecución SQL o conexión de BD burbujean al manejador global.
 */
=======
import { pool } from "../config/db";

>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function fetchAllTagsFromDb() {
  const { rows } = await pool.query(`
    SELECT tag_id, name 
    FROM tags 
    ORDER BY name ASC
  `);
  return rows;
}