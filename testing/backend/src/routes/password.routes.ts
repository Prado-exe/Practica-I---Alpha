/**
 * ============================================================================
 * MÓDULO: Enrutador de Recuperación de Contraseña (password.routes.ts)
 * * PROPÓSITO: Proveer los endpoints HTTP necesarios para el flujo de 
 * recuperación de credenciales ("Olvidé mi contraseña").
 * * RESPONSABILIDAD: Actuar como capa de validación inicial para las 
 * peticiones de recuperación y reseteo, aplicando reglas básicas de seguridad 
 * antes de delegar el trabajo criptográfico y de correo al servicio.
 * * DECISIONES DE DISEÑO / SUPUESTOS:
 * - Anti-Enumeración en el Enrutador: El diseño asume que la petición de 
 * recuperación siempre devolverá un HTTP 200 OK, independientemente de si el 
 * correo existe o no en la base de datos, para prevenir ataques de enumeración 
 * de usuarios.
 * - Validación Manual (Fail-Fast): A diferencia de otras rutas que usan Zod, 
 * aquí se implementan validaciones manuales tempranas (ej. `typeof body.token`) 
 * para garantizar la sanidad de los datos y evitar consumir costosos ciclos 
 * de CPU (bcrypt) si la contraseña es menor a 8 caracteres.
 * ============================================================================
 */
import type { HttpRequest, HttpResponse } from "../types/http";
import { readJsonBody } from "../utils/body";
import { sendJson } from "../utils/json";
import { requestPasswordReset, executePasswordReset } from "../services/auth.service";
import { getErrorStatus, getErrorMessage } from "./auth.routes";

/**
 * Descripción: Inicia el flujo de recuperación generando un token seguro y enviándolo por correo.
 * POR QUÉ: Se valida la presencia del correo directamente en el controlador para abortar la petición inmediatamente (Fallo Rápido / Fail-Fast) con un HTTP 400, evitando llamadas innecesarias a la base de datos si el payload está incompleto.
 * * FLUJO:
 * 1. Lee el payload JSON esperando un campo `email`.
 * 2. Verifica que el correo esté presente; si no, aborta.
 * 3. Delega al servicio la generación del token y el envío del correo.
 * 4. Devuelve un mensaje de éxito genérico para proteger la privacidad de la cuenta.
 * * @openapi
 * /api/recuperar-password:
 * post:
 * summary: Solicitar recuperación de contraseña
 * description: Envía un enlace de recuperación con un token seguro al correo proporcionado, si este existe en el sistema. Protegido contra enumeración de cuentas.
 * tags:
 * - Autenticación
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - email
 * properties:
 * email:
 * type: string
 * format: email
 * example: "usuario@institucion.com"
 * responses:
 * 200:
 * description: Solicitud procesada. Se devuelve un mensaje genérico de éxito.
 * 400:
 * description: Petición mal formada (correo faltante).
 * 500:
 * description: Error interno del servidor o fallo en el servicio de mensajería.
 * * @param req {HttpRequest} Objeto de la petición HTTP.
 * @param res {HttpResponse} Objeto de respuesta HTTP.
 * @return {Promise<void>}
 * @throws {Ninguna} Errores manejados y devueltos como respuesta JSON estandarizada.
 */
export async function requestPasswordResetAction(req: HttpRequest, res: HttpResponse) {
  try {
    const body = await readJsonBody<{ email: string }>(req);
    
    if (!body.email) {
      sendJson(res, 400, { ok: false, message: "El correo es obligatorio" });
      return;
    }

    const result = await requestPasswordReset(body.email);
    
    sendJson(res, 200, { ok: true, message: result.message });
  } catch (error) {
    sendJson(res, getErrorStatus(error), {
      ok: false,
      message: getErrorMessage(error),
    });
  }
}

/**
 * Descripción: Consume el token de recuperación y establece la nueva contraseña del usuario.
 * POR QUÉ: Implementa un workaround de coerción de tipos (`typeof body.token === "string" ? ... : ""`). Esto mitiga vulnerabilidades donde un atacante podría enviar arrays u objetos en lugar de strings, lo cual podría causar excepciones no controladas o comportamientos anómalos en el motor de base de datos o en la función de hashing. Además, impone una longitud mínima de 8 caracteres antes de invocar la encriptación por seguridad.
 * * FLUJO:
 * 1. Extrae el `token` y la `password` del cuerpo de la petición.
 * 2. Fuerza el tipo de dato a `string` para sanitizar la entrada.
 * 3. Valida que los datos existan y que la contraseña cumpla con la longitud mínima de seguridad (8 caracteres).
 * 4. Pasa los datos al servicio para validar el token, hashear la clave y quemar el token usado.
 * 5. Devuelve un estado HTTP 200 confirmando el cambio.
 * * @openapi
 * /api/reset-password:
 * post:
 * summary: Restablecer la contraseña
 * description: Establece una nueva contraseña para la cuenta verificando el token seguro enviado previamente por correo.
 * tags:
 * - Autenticación
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - token
 * - password
 * properties:
 * token:
 * type: string
 * description: El token criptográfico extraído de la URL del correo.
 * password:
 * type: string
 * description: La nueva contraseña del usuario (mínimo 8 caracteres).
 * example: "NuevaPasswordSegura123!"
 * responses:
 * 200:
 * description: Contraseña actualizada con éxito. Todas las sesiones activas previas han sido revocadas.
 * 400:
 * description: Faltan datos, la contraseña es muy corta, o el token de recuperación es inválido/expirado.
 * 500:
 * description: Error interno del servidor.
 * * @param req {HttpRequest} Objeto de la petición HTTP.
 * @param res {HttpResponse} Objeto de respuesta HTTP.
 * @return {Promise<void>}
 * @throws {Ninguna} Atrapa cualquier excepción (ej. token expirado) y la traduce a la respuesta HTTP adecuada.
 */
export async function resetPasswordAction(req: HttpRequest, res: HttpResponse) {
  try {
    const body = await readJsonBody<{ token: string; password: string }>(req);
    
    const token = typeof body.token === "string" ? body.token : "";
    const password = typeof body.password === "string" ? body.password : "";
    
    if (!token || !password) {
      sendJson(res, 400, { ok: false, message: "Faltan datos (token o contraseña)" });
      return;
    }

    if (password.length < 8) {
      sendJson(res, 400, { ok: false, message: "La contraseña debe tener al menos 8 caracteres" });
      return;
    }

    const result = await executePasswordReset(token, password);
    
    sendJson(res, 200, { ok: true, message: result.message });
  } catch (error) {
    sendJson(res, getErrorStatus(error), {
      ok: false,
      message: getErrorMessage(error),
    });
  }
}
