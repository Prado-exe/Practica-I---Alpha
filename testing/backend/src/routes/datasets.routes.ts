/**
 * ============================================================================
 * MÓDULO: Enrutador de Conjuntos de Datos (datasets.routes.ts)
 * * PROPÓSITO: Exponer los endpoints HTTP para las operaciones de lectura, 
 * creación, edición y borrado (CRUD) sobre los datasets.
 * * RESPONSABILIDAD: Actuar como la capa de transporte REST. Desempaqueta la 
 * petición HTTP, extrae las credenciales del JWT, realiza validaciones "fail-fast" 
 * de la URL, y estructura las respuestas estandarizadas hacia el cliente.
 * * ROL EN EL FLUJO DEL PROGRAMA: Es la primera frontera de contacto cuando 
 * el frontend solicita datos o mutaciones sobre los datasets. Intercepta la red, 
 * traduce la petición y la envía a la capa de Servicios (`datasets.service.ts`), 
 * aislando a la red de las reglas de negocio.
 * * DECISIONES DE DISEÑO / SUPUESTOS:
 * - Manejo Centralizado de Errores: Se asume el uso estricto de `getErrorStatus` 
 * y `getErrorMessage` para mantener un contrato de respuesta (JSON) uniforme.
 * - Fail-Fast en Controladores: Las validaciones de tipos básicos (ej. NaN en IDs) 
 * se hacen aquí antes de tocar el servicio para ahorrar carga de CPU y Base de Datos.
 * ============================================================================
 */
import { createDataset, getDatasets, getDatasetById, removeDataset, editDataset, submitDatasetRequest } from "../services/datasets.service";
import type { HttpRequest, HttpResponse } from "../types/http";
import { sendJson } from "../utils/json";
import { readJsonBody } from "../utils/body";
import { getErrorStatus, getErrorMessage } from "./auth.routes";
import { AppError } from "../types/app-error";
import { tryGetAuthPayload } from "../utils/auth";

/**
 * Descripción: Controlador para listar de forma paginada y filtrada los datasets disponibles.
 * POR QUÉ: Se extraen los permisos del token (`data_management.read`/`write`) para inyectarlos como una bandera (`isAdmin`) hacia la capa de servicio. Esto permite que el servicio aplique restricciones de visibilidad (ej. no mostrar borradores a usuarios comunes) sin que el controlador deba conocer las reglas de SQL. Además, se emplea `Math.max(1, ...)` para sanitizar la paginación y prevenir queries que rompan la base de datos (ej. inyección de OFFSET negativos).
 * @param {HttpRequest} req Objeto de la petición HTTP, contiene URL y token JWT desencriptado en `req.user`.
 * @param {HttpResponse} res Objeto de la respuesta HTTP.
 * @return {Promise<void>} Promesa que resuelve al enviar la respuesta JSON al cliente.
 * @throws {Ninguna} Los errores se envuelven en una respuesta HTTP gestionada.
 */
export async function getDatasetsAction(req: HttpRequest, res: HttpResponse) {
  try {
    const accountId = Number((req as any).user.sub);
    const permissions = (req as any).user.permissions || [];
    const isAdmin = permissions.includes("data_management.read") || permissions.includes("data_management.write");

    const url = new URL(req.url || "", `http://${req.headers?.host || "localhost"}`);
    const search = url.searchParams.get("search") || "";
    
    // Validamos y limpiamos la paginación para evitar que metan letras
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(url.searchParams.get("limit") || "10", 10));
    const result = await getDatasets(accountId, isAdmin, search, page, limit, {});
    sendJson(res, 200, { ok: true, ...result });
  } catch (error) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}

/**
 * Descripción: Controlador para procesar la creación de un nuevo dataset, incluyendo sus metadatos y la vinculación de archivos.
 * POR QUÉ: Extrae explícitamente el `accountId` y calcula el nivel de privilegios (`isAdmin`) directamente desde el payload JWT seguro, en lugar de confiar en que el frontend los envíe en el cuerpo de la petición. Retorna un estado HTTP 201 (Created) para adherirse estrictamente al estándar REST.
 * @param {HttpRequest} req Petición HTTP que contiene el payload del token y el cuerpo JSON con los datos.
 * @param {HttpResponse} res Respuesta HTTP.
 * @return {Promise<void>} 
 * @throws {Ninguna} Errores atrapados y enviados como status 400 o 500 según corresponda.
 */
export async function createDatasetAction(req: HttpRequest, res: HttpResponse) {
  try {
    const payload = tryGetAuthPayload(req);
    const accountId = Number(payload?.sub);
    const isAdmin = payload?.role === 'super_admin' || payload?.role === 'data_admin';
    const body = await readJsonBody<any>(req);
    const dataset = await createDataset(accountId, isAdmin, body);

    sendJson(res, 201, { ok: true, message: "Dataset creado como borrador", data: dataset });
  } catch (error) {
    console.error("❌ Error en createDatasetAction:", error);
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}

/**
 * Descripción: Controlador para obtener el detalle exhaustivo de un dataset específico por su ID.
 * POR QUÉ: Se aplica un patrón "Fail-fast" verificando `!id || isNaN(id)` inmediatamente. Esto evita que la petición viaje hasta el servicio y la base de datos si la URL está mal formada (ej. `/api/datasets/undefined`), ahorrando procesamiento innecesario.
 * @param {HttpRequest} req Petición HTTP que contiene el parámetro dinámico `id` en la URL.
 * @param {HttpResponse} res Respuesta HTTP.
 * @return {Promise<void>}
 * @throws {Ninguna}
 */
export async function getDatasetByIdAction(req: HttpRequest, res: HttpResponse) {
  try {
    const id = Number((req as any).params?.id);
    if (!id || isNaN(id)) return sendJson(res, 400, { ok: false, message: "ID inválido" });

    const dataset = await getDatasetById(id);
    sendJson(res, 200, { ok: true, data: dataset });
  } catch (error) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}

/**
 * Descripción: Controlador que gestiona la solicitud de borrado (Soft Delete) de un dataset.
 * POR QUÉ: Obliga la extracción del `accountId` desde el token JWT para inyectarlo en la llamada al servicio. Esto garantiza, por diseño, que el borrado en la base de datos deje un rastro de auditoría verídico con el identificador del usuario real que ejecutó la acción.
 * @param {HttpRequest} req Petición HTTP con el parámetro `id`.
 * @param {HttpResponse} res Respuesta HTTP.
 * @return {Promise<void>}
 * @throws {Ninguna}
 */
export async function deleteDatasetAction(req: HttpRequest, res: HttpResponse) {
  try {
    const id = Number((req as any).params?.id);
    if (!id || isNaN(id)) return sendJson(res, 400, { ok: false, message: "ID inválido" });

    const payload = tryGetAuthPayload(req);
    const accountId = Number(payload?.sub);

    const result = await removeDataset(id, accountId);
    sendJson(res, 200, { ok: true, message: result.message });
  } catch (error) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}

/**
 * Descripción: Controlador para procesar la modificación masiva de los metadatos de un dataset.
 * POR QUÉ: Al igual que en la operación de borrado, extrae el `accountId` del JWT y lo transfiere al servicio. Esta inyección de dependencias asegura que la transacción de actualización también asiente el evento forense de edición (`edited`) con el actor correcto.
 * @param {HttpRequest} req Petición HTTP con el `id` a editar y el cuerpo JSON de metadatos.
 * @param {HttpResponse} res Respuesta HTTP.
 * @return {Promise<void>}
 * @throws {Ninguna}
 */
export async function updateDatasetAction(req: HttpRequest, res: HttpResponse) {
  try {
    const id = Number((req as any).params?.id);
    if (!id || isNaN(id)) return sendJson(res, 400, { ok: false, message: "ID inválido" });

    const payload = tryGetAuthPayload(req);
    const accountId = Number(payload?.sub);
    const body = await readJsonBody<any>(req);

    const result = await editDataset(id, accountId, body);
    sendJson(res, 200, { ok: true, message: "Dataset actualizado", data: result });
  } catch (error) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}

// 4. Acción para el catálogo público (Sin autenticación)
export async function getPublicDatasetsAction(req: HttpRequest, res: HttpResponse) {
  try {
    const url = new URL(req.url || "", `http://${req.headers?.host || "localhost"}`);
    const search = url.searchParams.get("search") || "";
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(url.searchParams.get("limit") || "10", 10));

    const filters = {
      categoria: url.searchParams.get("categoria") || "",
      ods: url.searchParams.get("ods") || "",
      etiqueta: url.searchParams.get("etiqueta") || "",
      licencia: url.searchParams.get("licencia") || ""
    };

    const result = await getDatasets(0, false, search, page, limit, filters);
    

    // Respondemos con el mismo formato que espera tu frontend
    sendJson(res, 200, { ok: true, ...result });
  } catch (error) {
    console.error("❌ Error en getPublicDatasetsAction:", error);
    sendJson(res, 500, { ok: false, message: "Error interno del servidor" });
  }
}

// 5. Acción para ver detalles de un dataset públicamente (Sin autenticación)
export async function getPublicDatasetByIdAction(req: HttpRequest, res: HttpResponse) {
  try {
    // Tu router personalizado inyecta los parámetros en req.params
    const id = Number((req as any).params?.id);
    
    if (!id || isNaN(id)) {
      return sendJson(res, 400, { ok: false, message: "ID de dataset inválido" });
    }

    // Llamamos al servicio que ya tienes creado. 
    // Este servicio se encarga de traer los datos y firmar las URLs de los archivos.
    const dataset = await getDatasetById(id);
    
    // (Opcional) Seguridad extra: Asegurarnos de que nadie vea un borrador públicamente
    // Si tu estado público es diferente a 'published', cámbialo aquí.
    //if (dataset.dataset_status === 'draft' || dataset.dataset_status === 'deleted') {
      //return sendJson(res, 403, { ok: false, message: "Este dataset no está disponible públicamente" });
   // }

    sendJson(res, 200, { ok: true, data: dataset });
  } catch (error) {
    console.error("❌ Error en getPublicDatasetByIdAction:", error);

  }
}
/**
 * Controlador para gestionar el envío de datasets a revisión (user_management.write)
 */
export async function requestDatasetAction(req: HttpRequest, res: HttpResponse) {
  try {
    const payload = tryGetAuthPayload(req);
    const accountId = Number(payload?.sub);

    const body = await readJsonBody<any>(req);
    // Llamamos al nuevo servicio
    const dataset = await submitDatasetRequest(accountId, body);

    sendJson(res, 201, { ok: true, message: "Dataset enviado exitosamente para validación", data: dataset });
  } catch (error) {
    console.error("❌ Error en requestDatasetAction:", error);
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}

/**
 * Controlador para validar (publicar/rechazar) un dataset en pending_validation.
 */
export async function validateDatasetAction(req: HttpRequest, res: HttpResponse) {
  try {
    const id = Number((req as any).params?.id);
    if (!id || isNaN(id)) return sendJson(res, 400, { ok: false, message: "ID inválido" });

    const payload = tryGetAuthPayload(req);
    const adminAccountId = Number(payload?.sub);
    const body = await readJsonBody<any>(req);

    // Importamos dinámicamente o asegúrate de importar resolveDatasetRequest arriba
    const { resolveDatasetRequest } = require("../services/datasets.service");
    
    const result = await resolveDatasetRequest(id, adminAccountId, body);
    sendJson(res, 200, { ok: true, message: result.message });
  } catch (error) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}