<<<<<<< HEAD
=======
/**
 * ============================================================================
 * MÓDULO: Enrutador de ODS (ods.routes.ts)
 * * PROPÓSITO: Exponer el endpoint HTTP para consultar el catálogo de 
 * Objetivos de Desarrollo Sostenible (ODS) de la ONU.
 * * RESPONSABILIDAD: Recibir la petición de listado de ODS, invocar al servicio 
 * correspondiente para recuperar los datos y retornar una respuesta JSON 
 * unificada y estructurada.
 * * DECISIONES DE DISEÑO / SUPUESTOS:
 * - Conjunto de Datos Finito: Los ODS son un estándar internacional que consta 
 * de exactamente 17 objetivos fijos. Por lo tanto, se omite intencionalmente 
 * cualquier parámetro de paginación (`limit`, `offset`) en la petición. El 
 * diseño asume que el frontend requiere siempre la colección entera en una 
 * sola llamada para poblar componentes UI estáticos (ej. Dropdowns).
 * ============================================================================
 */
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
import { getOdsForDropdown } from "../services/ods.service";
import type { HttpRequest, HttpResponse } from "../types/http";
import { sendJson } from "../utils/json";
import { getErrorStatus, getErrorMessage } from "./auth.routes";

<<<<<<< HEAD
=======
/**
 * Descripción: Controlador que atiende las peticiones GET para obtener la lista completa de los ODS.
 * POR QUÉ: Se reutilizan las funciones `getErrorStatus` y `getErrorMessage` del módulo de autenticación para asegurar que cualquier excepción de base de datos o red devuelva el mismo contrato de error (status HTTP semántico y un JSON predecible) que el resto de la API, facilitando el manejo de errores globales en el frontend.
 * * FLUJO:
 * 1. Invoca al servicio de ODS para obtener la lista optimizada para dropdowns.
 * 2. Empaqueta el resultado en un JSON bajo el formato `{ ok: true, data: [...] }`.
 * 3. En caso de error, emite un JSON estandarizado con la bandera `ok: false`.
 * * @openapi
 * /api/ods:
 * get:
 * summary: Listar Objetivos de Desarrollo Sostenible
 * description: Devuelve el listado completo y ordenado de los 17 ODS estandarizados por la ONU para su uso en selectores y filtros.
 * tags:
 * - Catálogos Maestros
 * responses:
 * 200:
 * description: Lista de ODS recuperada exitosamente.
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
 * ods_id:
 * type: integer
 * example: 1
 * ods_number:
 * type: integer
 * example: 1
 * name:
 * type: string
 * example: "Fin de la pobreza"
 * 500:
 * description: Error interno al intentar comunicar con la base de datos.
 * * @param req {HttpRequest} Objeto de la petición HTTP.
 * @param res {HttpResponse} Objeto de respuesta HTTP.
 * @return {Promise<void>} 
 * @throws {Ninguna} Los errores se envuelven y devuelven como respuestas HTTP gestionadas.
 */
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function getAllOdsAction(req: HttpRequest, res: HttpResponse) {
  try {
    const data = await getOdsForDropdown();
    sendJson(res, 200, { ok: true, data });
  } catch (error) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}