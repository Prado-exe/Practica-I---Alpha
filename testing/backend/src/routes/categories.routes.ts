<<<<<<< HEAD
/**
 * ============================================================================
 * MÓDULO: Enrutador de Categorías (categories.routes.ts)
 * * PROPÓSITO: Exponer los endpoints HTTP para la consulta de categorías 
 * maestras del sistema.
 * * RESPONSABILIDAD: Actuar como la capa de transporte que comunica las 
 * peticiones del cliente con la lógica de negocio del servicio de categorías, 
 * asegurando respuestas estandarizadas.
 * * DECISIONES DE DISEÑO / SUPUESTOS:
 * - Consistencia en Errores: Se reutilizan las utilidades `getErrorStatus` y 
 * `getErrorMessage` provenientes del módulo de autenticación. 
 * Esto garantiza que, aunque este sea un módulo de datos maestros simple, 
 * el frontend reciba un contrato de error idéntico al de los flujos críticos 
 * (como el login), facilitando la implementación de interceptores globales.
 * ============================================================================
 */
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
import { getCategoriesForDropdown } from "../services/categories.service";
import { HttpRequest, HttpResponse} from "../types/http"; 
import { sendJson} from "../utils/json";
import { getErrorStatus, getErrorMessage } from "./auth.routes";

<<<<<<< HEAD
/**
 * Descripción: Controlador que procesa peticiones GET para obtener todas las categorías destinadas a componentes de selección.
 * POR QUÉ: Delega la recuperación al servicio `getCategoriesForDropdown` para mantener el controlador "delgado" (Thin Controller). Se utiliza un bloque try-catch exhaustivo para asegurar que cualquier fallo en la capa de datos no tumbe el proceso de Node.js, transformando excepciones técnicas en respuestas JSON semánticas mediante el helper centralizado de errores.
 * * @openapi
 * /api/categorias:
 * get:
 * summary: Listar categorías para selectores
 * description: Recupera el catálogo de categorías activas (ID y Nombre) diseñado para poblar componentes UI de tipo dropdown.
 * tags:
 * - Catálogos Maestros
 * responses:
 * 200:
 * description: Lista de categorías obtenida exitosamente.
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
 * category_id:
 * type: integer
 * legal_name:
 * type: string
 * 500:
 * description: Error de servidor o base de datos.
 * * @param req {HttpRequest} Objeto de la petición entrante.
 * @param res {HttpResponse} Objeto de respuesta saliente.
 * @return {Promise<void>} Envía un JSON con el resultado de la operación.
 * @throws {Ninguna} Las excepciones se capturan y retornan vía HTTP.
 */
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function getAllCategoriesAction(req: HttpRequest, res: HttpResponse) {
  try {
    const data = await getCategoriesForDropdown();
    sendJson(res, 200, { ok: true, data });
  } catch (error) {
<<<<<<< HEAD
    console.error("❌ Error en getAllCategoriesAction:", error); // AGREGAR ESTO
  sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
=======
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
  }
}