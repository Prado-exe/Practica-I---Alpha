<<<<<<< HEAD
import { fetchAllTagsFromDb } from "../repositories/tags.repository";

=======
/**
 * ============================================================================
 * MÓDULO: Servicio de Etiquetas/Tags (tags.service.ts)
 * * PROPÓSITO: Proveer la lógica de negocio para la recuperación del 
 * catálogo de etiquetas o palabras clave (tags) del sistema.
 * * RESPONSABILIDAD: Servir de intermediario entre los controladores HTTP 
 * y la capa de acceso a datos (repositorio) de las etiquetas.
 * * DECISIONES DE DISEÑO / SUPUESTOS:
 * - Al igual que con las categorías y los ODS, se asume que la carga completa 
 * de etiquetas es necesaria y óptima para componentes de UI tipo "multi-select" 
 * o autocompletado en el cliente. Si la taxonomía de etiquetas crece 
 * desproporcionadamente en el futuro (miles de registros), este es el punto 
 * arquitectónico donde se debería implementar una capa de caché en memoria 
 * o refactorizar hacia un motor de búsqueda por aproximación (typeahead).
 * ============================================================================
 */
import { fetchAllTagsFromDb } from "../repositories/tags.repository";

/**
 * Descripción: Recupera el listado completo de etiquetas (tags) registradas en la base de datos.
 * POR QUÉ: La función expone el sufijo "ForDropdown" como una declaración de intención estricta de diseño: su único propósito es poblar selectores, combos o listas de autocompletado en la interfaz de usuario (ej. al describir y clasificar datasets). Esto advierte a futuros desarrolladores que no deben modificar esta función para inyectar paginación, ya que dichos componentes UI asumen la disponibilidad de la colección completa para operar.
 * @param {void} No requiere parámetros de entrada.
 * @return {Promise<Array>} Lista de objetos que representan las etiquetas disponibles en el sistema.
 * @throws {Ninguna} Las excepciones originadas en la base de datos se propagan silenciosamente al manejador de errores global del router.
 */
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function getTagsForDropdown() {
  return await fetchAllTagsFromDb();
}