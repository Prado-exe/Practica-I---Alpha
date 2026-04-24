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

export async function fetchAllTagsFromDb() {
  const { rows } = await pool.query(`
    SELECT t.tag_id, t.name, COUNT(dt.dataset_id)::int as dataset_count
    FROM tags t
    LEFT JOIN dataset_tags dt ON t.tag_id = dt.tag_id
    GROUP BY t.tag_id, t.name
    ORDER BY t.name ASC
  `);
  return rows;
}

export async function insertTagInDb(name: string) {
  const { rows } = await pool.query(
    'INSERT INTO tags (name) VALUES ($1) RETURNING *',
    [name]
  );
  return rows[0];
}

/**
 * Reemplaza una etiqueta por otra en todos los datasets asociados y luego elimina la antigua.
 */
export async function replaceAndDeleteTagInDb(oldTagId: number, replacementTagId: number) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Mover las asociaciones (usando ON CONFLICT para evitar duplicados si el dataset ya tenía la de reemplazo)
    await client.query(`
      INSERT INTO dataset_tags (dataset_id, tag_id)
      SELECT dataset_id, $2 FROM dataset_tags WHERE tag_id = $1
      ON CONFLICT (dataset_id, tag_id) DO NOTHING
    `, [oldTagId, replacementTagId]);

    // 2. Eliminar las asociaciones viejas
    await client.query('DELETE FROM dataset_tags WHERE tag_id = $1', [oldTagId]);

    // 3. Eliminar la etiqueta físicamente
    await client.query('DELETE FROM tags WHERE tag_id = $1', [oldTagId]);

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteTagInDb(tagId: number) {
  await pool.query('DELETE FROM tags WHERE tag_id = $1', [tagId]);
}