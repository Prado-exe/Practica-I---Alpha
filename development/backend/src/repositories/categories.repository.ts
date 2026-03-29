<<<<<<< HEAD
import { pool } from "../config/db";

export async function fetchAllCategoriesFromDb() {
  const { rows } = await pool.query(`
    SELECT category_id, legal_name 
    FROM categories 
    WHERE category_status = 'active' 
    ORDER BY legal_name ASC
=======
/**
 * ============================================================================
 * MÓDULO: Repositorio de Categorías (categories.repository.ts)
 * * PROPÓSITO: Manejar el acceso directo a la tabla de datos maestros de categorías.
 * * RESPONSABILIDAD: Ejecutar consultas SQL optimizadas para recuperar la 
 * taxonomía principal del sistema y entregarla a la capa de servicios.
 * * DECISIONES DE DISEÑO / SUPUESTOS:
 * - Optimización de Payload: Las consultas solicitan estrictamente las 
 * columnas requeridas (ID y Nombre) en lugar de un `SELECT *`. Esto reduce 
 * drásticamente el consumo de memoria y ancho de banda de red, asumiendo que 
 * el frontend necesita cargar toda esta colección de golpe para los selectores.
 * ============================================================================
 */
import { pool } from "../config/db";

/**
 * Descripción: Recupera la lista de categorías que se encuentran disponibles para uso en el sistema.
 * POR QUÉ: Filtra explícitamente por `category_status = 'active'` para aplicar la regla de negocio de borrado lógico (soft-delete), previniendo que categorías obsoletas aparezcan en la creación de nuevos recursos. Adicionalmente, delega el ordenamiento alfabético (`ORDER BY legal_name ASC`) al motor de PostgreSQL, aprovechando sus índices y liberando a Node.js y a la UI de realizar cómputo iterativo.
 * @param {void} No requiere parámetros de entrada.
 * @return {Promise<Array<{category_id: number, legal_name: string}>>} Arreglo con identificadores y nombres de categorías activas.
 * @throws {Ninguna} Los errores de conexión de red se propagan al manejador global.
 */
export async function fetchAllCategoriesFromDb() {
  const { rows } = await pool.query(`
    SELECT category_id, name 
    FROM categories 
    WHERE is_active = TRUE 
    ORDER BY name ASC
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
  `);
  return rows;
}