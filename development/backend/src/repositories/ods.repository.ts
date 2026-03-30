/**
 * ============================================================================
 * MÓDULO: Repositorio de ODS (ods.repository.ts)
 * * PROPÓSITO: Proveer el acceso a la tabla de base de datos que almacena los 
 * Objetivos de Desarrollo Sostenible (ODS) de la ONU.
 * * RESPONSABILIDAD: Ejecutar consultas SQL para extraer la información 
 * fundamental de los ODS y servirla a las capas de negocio.
 * * DECISIONES DE DISEÑO / SUPUESTOS:
 * - Naturaleza de los Datos: Al ser los ODS un estándar internacional fijo y 
 * finito (17 objetivos), se asume que la consulta siempre devolverá un 
 * volumen de datos muy pequeño. Por ende, es seguro y más eficiente recuperar 
 * la tabla entera en una sola petición sin implementar mecanismos de paginación.
 * ============================================================================
 */
import { pool } from "../config/db";

/**
 * Descripción: Extrae el catálogo completo de los Objetivos de Desarrollo Sostenible.
 * POR QUÉ: El ordenamiento por `ods_number ASC` no es estético, sino una regla de negocio crítica; la presentación gráfica y la lógica en el frontend requieren que los objetivos se listen estrictamente en su secuencia numérica oficial dictada por la ONU. Además, se solicitan campos específicos (`ods_id`, `ods_number`, `name`) en lugar de un `SELECT *` para evitar transportar metadatos innecesarios por la red.
 * @param {void} No requiere parámetros de entrada.
 * @return {Promise<Array<{ods_id: number, ods_number: number, name: string}>>} Arreglo ordenado con los datos esenciales de cada ODS.
 * @throws {Ninguna} Las excepciones de conectividad de la base de datos (ej. pool exhausto) burbujean al manejador global.
 */
export async function fetchAllOdsFromDb() {
  const { rows } = await pool.query(`
    SELECT ods_id, ods_number, name 
    FROM ods_objectives 
    ORDER BY ods_number ASC
  `);
  return rows;
}