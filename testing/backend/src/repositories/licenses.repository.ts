/**
 * ============================================================================
 * MÓDULO: Repositorio de Licencias (licenses.repository.ts)
 * * PROPÓSITO: Administrar el acceso a la tabla de datos maestros que contiene 
 * las licencias de uso (ej. Creative Commons, Open Data) para los datasets.
 * * RESPONSABILIDAD: Ejecutar sentencias SQL optimizadas para recuperar el 
 * catálogo de licencias y entregarlo a la capa de servicios.
 * * DECISIONES DE DISEÑO / SUPUESTOS:
 * - Optimización de Payload: Se seleccionan estrictamente las columnas 
 * necesarias (`license_id`, `name`, `code`) evitando el antipatrón `SELECT *`. 
 * Dado que los estándares de licencias son estáticos y de muy bajo volumen, 
 * se asume seguro cargar la colección completa en memoria sin paginación.
 * ============================================================================
 */
import { pool } from "../config/db";

/**
 * Descripción: Recupera el listado de licencias de uso de datos que están habilitadas en el sistema.
 * POR QUÉ: Incorpora la cláusula `WHERE is_active = TRUE` para aplicar la regla de negocio de desactivación lógica (soft-delete). Esto garantiza que si una licencia queda obsoleta por regulaciones legales, no pueda ser asignada a nuevos datasets, pero mantenga la integridad referencial en los datasets antiguos. Delega el ordenamiento al motor SQL (`ORDER BY name ASC`) por eficiencia.
 * @param {void} No requiere parámetros de entrada.
 * @return {Promise<Array<{license_id: number, name: string, code: string}>>} Arreglo con la información base de las licencias activas.
 * @throws {Ninguna} Los errores a nivel de base de datos (ej. pérdida de conexión) burbujean al manejador global.
 */
export async function fetchAllLicensesFromDb() {
  const { rows } = await pool.query(`
    SELECT license_id, name, code 
    FROM licenses 
    WHERE is_active = TRUE 
    ORDER BY name ASC
  `);
  return rows;
}