<<<<<<< HEAD
/**
 * ============================================================================
 * MÓDULO: Servicio de ODS (ods.service.ts)
 * * PROPÓSITO: Proveer la lógica de negocio para la recuperación de los 
 * Objetivos de Desarrollo Sostenible (ODS) configurados en el sistema.
 * * RESPONSABILIDAD: Funcionar como capa de abstracción entre los controladores 
 * HTTP y el repositorio de datos maestros de ODS.
 * * DECISIONES DE DISEÑO / SUPUESTOS:
 * - Los ODS representan un estándar global altamente estático (los 17 objetivos 
 * de la ONU). Por lo tanto, se asume que esta consulta devuelve un conjunto 
 * de datos pequeño y constante. Si se requiere optimización por alta 
 * concurrencia en el futuro, este es el punto de inyección exacto para un caché 
 * en memoria sin afectar la capa de ruteo ni el repositorio.
 * ============================================================================
 */
import { fetchAllOdsFromDb } from "../repositories/ods.repository";

/**
 * Descripción: Recupera el listado completo de los Objetivos de Desarrollo Sostenible (ODS).
 * POR QUÉ: Se utiliza el sufijo explícito "ForDropdown" para dictar un contrato de uso estricto: este método está diseñado exclusivamente para poblar selectores (dropdowns/comboboxes o listas de tags) en el frontend (por ejemplo, al clasificar un nuevo dataset). Esto advierte a futuros desarrolladores que no deben aplicar filtros limitantes o paginación en esta función, ya que rompería la interfaz de usuario que espera el listado completo para selección.
 * @param {void} No requiere parámetros de entrada.
 * @return {Promise<Array>} Lista de objetos que representan los ODS activos.
 * @throws {Ninguna} Las excepciones de conectividad o base de datos no se capturan aquí; burbujean directamente al manejador global de errores.
 */

=======
import { fetchAllOdsFromDb } from "../repositories/ods.repository";

>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function getOdsForDropdown() {
  return await fetchAllOdsFromDb();
}