"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAllCategoriesFromDb = fetchAllCategoriesFromDb;
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
const db_1 = require("../config/db");
/**
 * Descripción: Recupera la lista de categorías que se encuentran disponibles para uso en el sistema.
 * POR QUÉ: Filtra explícitamente por `category_status = 'active'` para aplicar la regla de negocio de borrado lógico (soft-delete), previniendo que categorías obsoletas aparezcan en la creación de nuevos recursos. Adicionalmente, delega el ordenamiento alfabético (`ORDER BY legal_name ASC`) al motor de PostgreSQL, aprovechando sus índices y liberando a Node.js y a la UI de realizar cómputo iterativo.
 * @param {void} No requiere parámetros de entrada.
 * @return {Promise<Array<{category_id: number, legal_name: string}>>} Arreglo con identificadores y nombres de categorías activas.
 * @throws {Ninguna} Los errores de conexión de red se propagan al manejador global.
 */
async function fetchAllCategoriesFromDb() {
    const { rows } = await db_1.pool.query(`
    SELECT category_id, name 
    FROM categories 
    WHERE is_active = TRUE 
    ORDER BY name ASC
  `);
    return rows;
}
