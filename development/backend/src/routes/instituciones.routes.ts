<<<<<<< HEAD
=======
/**
 * ============================================================================
 * MÓDULO: Enrutador de Instituciones (instituciones.routes.ts)
 * * PROPÓSITO: Definir y gestionar los puntos de entrada HTTP para la 
 * administración y consulta pública de instituciones.
 * * RESPONSABILIDAD: Actuar como capa de transporte, extrayendo parámetros de 
 * ruta y cuerpos de petición, gestionando la identidad del autor de las acciones 
 * y estandarizando las respuestas exitosas o fallidas.
 * * DECISIONES DE DISEÑO / SUPUESTOS:
 * - Trazabilidad: Se integra `tryGetAuthPayload` para capturar el `sub` (ID de cuenta) 
 * en operaciones de escritura, asegurando que cada institución creada o editada 
 * tenga un responsable asignado en la base de datos.
 * - Parámetros Dinámicos: Se asume que el enrutador del sistema inyecta los 
 * parámetros de URL en el objeto `req.params`, requiriendo aserciones de tipo 
 * para extraer IDs numéricos.
 * ============================================================================
 */
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
import type { HttpRequest, HttpResponse } from "../types/http";
import { sendJson} from "../utils/json";
import { readJsonBody } from "../utils/body";
import { getErrorStatus, getErrorMessage } from "./auth.routes"; 
import { getInstitutions, addInstitution, editInstitution, removeInstitution, getPublicInstitutions } from "../services/instituciones.service";

<<<<<<< HEAD
// Para obtener el account_id de la persona que está creando la institución
import { tryGetAuthPayload } from "../utils/auth"; 

=======

import { tryGetAuthPayload } from "../utils/auth"; 

/**
 * Descripción: Recupera el listado completo de instituciones para la vista administrativa.
 * POR QUÉ: A diferencia de la ruta pública, este endpoint devuelve la colección íntegra sin filtros de acceso, permitiendo que los administradores tengan una visión global de todas las entidades registradas, independientemente de su estado o nivel de visibilidad.
 * @param req {HttpRequest} Objeto de petición.
 * @param res {HttpResponse} Objeto de respuesta.
 * @return {Promise<void>} Envía un JSON con el array de instituciones.
 * @throws {Ninguna} Errores capturados y procesados por `getErrorStatus`.
 */
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function getInstitucionesAction(req: HttpRequest, res: HttpResponse) {
  try {
    const instituciones = await getInstitutions();
    sendJson(res, 200, { ok: true, instituciones });
  } catch (error) {
<<<<<<< HEAD
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}

export async function createInstitucionAction(req: HttpRequest, res: HttpResponse) {
  try {
    // Obtenemos quién está haciendo la petición
=======
    console.error("❌ Error en getAllCategoriesAction:", error); // AGREGAR ESTO
  sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}

/**
 * Descripción: Procesa la creación de una nueva institución vinculándola al usuario actual.
 * POR QUÉ: Realiza la extracción del `accountId` desde el token JWT antes de parsear el body. Esto garantiza que la autoría sea inyectada por el servidor y no pueda ser suplantada por el cliente en el cuerpo de la petición.
 * @param req {HttpRequest} Incluye el objeto `institution` y metadatos del `file` (logo).
 * @param res {HttpResponse} Respuesta 201 en caso de éxito.
 * @return {Promise<void>}
 * @throws {Ninguna} Errores de validación o permisos gestionados por el servicio.
 */
export async function createInstitucionAction(req: HttpRequest, res: HttpResponse) {
  try {
  
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
    const payload = tryGetAuthPayload(req);
    const accountId = Number(payload?.sub);

    const body = await readJsonBody<{ institution: any, file: any }>(req);
    
    const inst = await addInstitution(body.institution, body.file, accountId);
    sendJson(res, 201, { ok: true, message: "Institución creada", institucion: inst });
  } catch (error) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}

<<<<<<< HEAD
=======
/**
 * Descripción: Actualiza los datos de una institución existente identificada por su ID.
 * POR QUÉ: Implementa una validación previa del ID (`isNaN`) para evitar llamadas costosas al servicio si el parámetro de ruta es inválido. Soporta la actualización parcial donde el logo (`file`) puede ser omitido si el administrador solo desea corregir metadatos de texto.
 * @param req {HttpRequest} Contiene el ID en params y los nuevos datos en el body.
 * @param res {HttpResponse} Respuesta 200 con la institución actualizada.
 * @return {Promise<void>}
 * @throws {400} Si el ID proporcionado no es un número válido.
 */
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function updateInstitucionAction(req: HttpRequest, res: HttpResponse) {
  try {
    const id = Number((req as any).params?.id);
    if (!id || isNaN(id)) return sendJson(res, 400, { ok: false, message: "ID inválido" });

<<<<<<< HEAD
    // Obtenemos quién está haciendo la petición
    const payload = tryGetAuthPayload(req);
    const accountId = Number(payload?.sub);

    // En edición, 'file' puede venir como null si el admin no seleccionó una nueva imagen
=======
 
    const payload = tryGetAuthPayload(req);
    const accountId = Number(payload?.sub);

   
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
    const body = await readJsonBody<{ institution: any, file: any }>(req);
    
    const inst = await editInstitution(id, body.institution, body.file, accountId);
    sendJson(res, 200, { ok: true, message: "Institución actualizada correctamente", institucion: inst });
  } catch (error) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}

<<<<<<< HEAD
=======
/**
 * Descripción: Elimina una institución del sistema de forma definitiva.
 * POR QUÉ: Sigue el patrón RESTful al extraer el ID del recurso directamente desde la ruta de la petición. Delega la lógica de integridad referencial (como qué sucede con los logos huérfanos) totalmente a la capa de servicio.
 * @param req {HttpRequest} Requiere el ID del recurso en los parámetros de ruta.
 * @param res {HttpResponse} Respuesta de confirmación.
 * @return {Promise<void>}
 * @throws {400} Si el ID es inválido.
 * @throws {404} Si la institución no existe (vía servicio).
 */
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function deleteInstitucionAction(req: HttpRequest, res: HttpResponse) {
  try {
    const id = Number((req as any).params?.id);
    if (!id || isNaN(id)) return sendJson(res, 400, { ok: false, message: "ID inválido" });

    const result = await removeInstitution(id);
    sendJson(res, 200, { ok: true, message: result.message });
  } catch (error) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}

<<<<<<< HEAD
// --- RUTA PÚBLICA ---
export async function getPublicInstitucionesAction(req: HttpRequest, res: HttpResponse) {
  try {
    // 1. Extraemos los parámetros de búsqueda y paginación de la URL (ej: ?search=salud&page=2&limit=9)
=======
/**
 * Descripción: Provee una lista de instituciones filtrada por visibilidad pública, con soporte para búsqueda y paginación.
 * POR QUÉ: Es el único controlador que parsea manualmente la Query String (`URLSearchParams`). Se separa de la ruta administrativa para aplicar reglas de compensación (offset) y límites que optimizan el rendimiento del frontend, devolviendo metadatos de paginación (`totalPages`) necesarios para renderizar los controles de navegación de la lista pública.
 * @param req {HttpRequest} Soporta query params: `search`, `page`, `limit`.
 * @param res {HttpResponse} Respuesta 200 con datos paginados.
 * @return {Promise<void>}
 * @throws {Ninguna}
 */
export async function getPublicInstitucionesAction(req: HttpRequest, res: HttpResponse) {
  try {
  
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
    const url = new URL(req.url || "", `http://${req.headers?.host || "localhost"}`);
    const search = url.searchParams.get("search") || "";
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "9", 10);

<<<<<<< HEAD
    // 2. Llamamos a nuestro nuevo servicio público
    const result = await getPublicInstitutions(search, page, limit);
    
    // 3. Devolvemos los datos con la estructura que espera la paginación
=======
   
    const result = await getPublicInstitutions(search, page, limit);
    
  
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
    sendJson(res, 200, { 
      ok: true, 
      total: result.total,
      totalPages: result.totalPages,
      data: result.data 
    });
  } catch (error) {
<<<<<<< HEAD
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
=======
    console.error("❌ Error en getAllCategoriesAction:", error); // AGREGAR ESTO
  sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
  }
}