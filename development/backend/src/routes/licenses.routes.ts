/**
 * ============================================================================
 * MÓDULO: Enrutador de Licencias (licenses.routes.ts)
 * * PROPÓSITO: Proveer el punto de entrada HTTP para la recuperación del 
 * catálogo maestro de licencias de uso del sistema.
 * * RESPONSABILIDAD: Gestionar la petición de lectura de licencias y 
 * estandarizar la salida JSON, actuando como puente directo con el repositorio 
 * para datos de referencia estáticos.
 * * DECISIONES DE DISEÑO / SUPUESTOS:
 * - Simplificación de Capas: Al tratarse de una consulta de solo lectura a 
 * datos maestros con lógica de negocio inexistente, el controlador consume 
 * directamente el repositorio. Esto evita el "over-engineering" de crear un 
 * servicio intermedio, optimizando la latencia para este recurso específico.
 * ============================================================================
 */
import { fetchAllLicensesFromDb } from "../repositories/licenses.repository";
import type { HttpRequest, HttpResponse } from "../types/http";
import { sendJson } from "../utils/json";

/**
 * Descripción: Controlador que procesa la obtención de todas las licencias de uso disponibles.
 * POR QUÉ: Centraliza la entrega del catálogo de licencias garantizando un contrato de respuesta predecible. En caso de fallo en la infraestructura de datos, el controlador captura la excepción y retorna un error 500 genérico para evitar la exposición de detalles internos de la base de datos al cliente, permitiendo que el frontend gestione el estado de error de forma controlada.
 * * FLUJO:
 * 1. Invoca la función del repositorio para extraer todas las licencias.
 * 2. Responde con un HTTP 200 y el arreglo de datos en caso de éxito.
 * 3. En caso de excepción, captura el error y emite un mensaje de fallo con estado 500.
 * * @openapi
 * /api/licencias:
 * get:
 * summary: Listar todas las licencias de uso
 * description: Recupera el catálogo maestro de licencias (ej. Creative Commons, Open Data) para la clasificación de datasets.
 * tags:
 * - Catálogos Maestros
 * responses:
 * 200:
 * description: Catálogo recuperado exitosamente.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * ok:
 * type: boolean
 * example: true
 * data:
 * type: array
 * items:
 * type: object
 * properties:
 * license_id:
 * type: integer
 * name:
 * type: string
 * code:
 * type: string
 * 500:
 * description: Error interno al obtener el catálogo de licencias.
 * * @param req {HttpRequest} Objeto de la petición HTTP.
 * @param res {HttpResponse} Objeto de respuesta HTTP.
 * @return {Promise<void>}
 * @throws {Ninguna} Los errores se gestionan internamente y se retornan como respuesta HTTP.
 */
export async function getAllLicensesAction(req: HttpRequest, res: HttpResponse) {
  try {
    const data = await fetchAllLicensesFromDb();
    sendJson(res, 200, { ok: true, data });
  } catch (error) {
    sendJson(res, 500, { ok: false, message: "Error al obtener licencias" });
  }
}