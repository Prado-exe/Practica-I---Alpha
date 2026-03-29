/**
 * ============================================================================
 * MÓDULO: Servicio de Categorías (categories.service.ts)
 * * PROPÓSITO: Proveer la lógica de negocio para la recuperación de las 
 * categorías maestras del sistema.
 * * RESPONSABILIDAD: Actuar como capa de abstracción entre los controladores HTTP 
 * y el acceso a datos (repositorios), asegurando que el frontend reciba la 
 * información en el formato esperado.
 * * DECISIONES DE DISEÑO / SUPUESTOS:
 * - Al tratarse de datos maestros (estáticos y de bajo volumen) utilizados 
 * constantemente en la interfaz, se asume una consulta directa de lectura ágil. 
 * Si en el futuro se requiere optimización, aquí se implementaría una capa de 
 * caché en memoria sin necesidad de modificar ni las rutas ni los repositorios.
 * ============================================================================
 */
import { fetchAllCategoriesFromDb } from "../repositories/categories.repository";

/**
 * Descripción: Recupera la lista completa de categorías activas para su uso en la interfaz de usuario.
 * POR QUÉ: Se nombra explícitamente "ForDropdown" en lugar de un "getAll" genérico para dictar su contrato de uso: esta función está diseñada para llenar selectores (select/dropdowns) en el frontend (ej. al crear un Dataset). Esto indica a futuros desarrolladores que NO deben agregarle paginación a esta consulta, ya que rompería los formularios del cliente.
 * @param {void} No requiere parámetros de entrada.
 * @return {Promise<Array>} Lista de objetos que representan las categorías disponibles.
 * @throws {Ninguna} No lanza excepciones de negocio (los errores de base de datos burbujean al manejador global).
 */
export async function getCategoriesForDropdown() {
  return await fetchAllCategoriesFromDb();
}