/**
 * ============================================================================
 * MÓDULO: Enrutador de Registro de Usuarios (register.routes.ts)
 * * PROPÓSITO: Exponer el endpoint HTTP para la creación y registro de nuevas 
 * cuentas de usuario en el sistema.
 * * RESPONSABILIDAD: Funcionar como la primera barrera defensiva de la API, 
 * parseando el cuerpo de la petición y validándolo estrictamente antes de 
 * delegar la creación de la cuenta al servicio de negocio.
 * * DECISIONES DE DISEÑO / SUPUESTOS:
 * - Registro Sin Estado (Stateless Registration): Por motivos de seguridad, 
 * la creación exitosa de una cuenta no inicia automáticamente una sesión ni 
 * devuelve tokens JWT. El cliente asume el estado "pendiente de verificación" 
 * y debe validar su correo o hacer un login explícito posteriormente.
 * - Manejo de Errores de Zod: Se aíslan los errores de validación de esquema 
 * (`ZodError`) del resto de excepciones para proveer al frontend un array 
 * detallado de qué campos específicos fallaron en el formulario.
 * ============================================================================
 */
import type { HttpRequest, HttpResponse } from "../types/http";
import { readJsonBody } from "../utils/body";
import { sendJson } from "../utils/json";
import { ZodError } from "zod";
import { registerSchema } from "../validators/auth.validators";
import { registerUser } from "../services/auth.service";
import { getErrorStatus, getErrorMessage } from "./auth.routes";
import { adminCreateUser } from "../services/auth.service";


/**
 * Descripción: Controlador que orquesta la creación de un nuevo usuario validando sus datos de entrada.
 * POR QUÉ: Se implementa una captura explícita de `ZodError` (Fallo Rápido) para diferenciar semánticamente un error de formato del cliente (HTTP 400) de un error de lógica de negocio (ej. HTTP 409 Conflicto si el correo ya existe), permitiendo a la interfaz de usuario renderizar mensajes de error precisos en cada input del formulario.
 * * FLUJO:
 * 1. Lee el payload JSON entrante.
 * 2. Valida la estructura mediante `registerSchema`.
 * 3. Solicita al servicio la creación del usuario y generación del OTP.
 * 4. Devuelve los metadatos públicos de la cuenta con un estado 201 (Creado).
 * * @openapi
 * /api/register:
 * post:
 * summary: Registrar una nueva cuenta de usuario
 * description: |
 * **Flujo de Registro de Cuenta**
 * * Crea un nuevo usuario en el sistema. Los datos de entrada pasan por una validación estricta (Zod).
 * Si el registro es exitoso, el sistema devuelve los datos públicos de la cuenta recién creada
 * y los detalles sobre su estado de verificación (por ejemplo, si se requiere confirmar el correo).
 * * *Nota de Seguridad:* Este endpoint **no** inicia la sesión automáticamente.
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
 * - password
 * - first_name
 * - last_name
 * properties:
 * email:
 * type: string
 * format: email
 * example: "nuevo.investigador@institucion.com"
 * password:
 * type: string
 * example: "MiPasswordSeguro123!"
 * first_name:
 * type: string
 * example: "Ana"
 * last_name:
 * type: string
 * example: "García"
 * responses:
 * 201:
 * description: Cuenta creada con éxito. Devuelve los datos básicos del usuario y su estado de verificación.
 * 400:
 * description: Datos inválidos. Falló la validación del esquema (ej. contraseña muy corta). Devuelve un array con los campos específicos que fallaron.
 * 409:
 * description: Conflicto. El correo electrónico ya se encuentra registrado en el sistema.
 * 500:
 * description: Error interno del servidor.
 * * @param req {HttpRequest} Objeto de la petición HTTP.
 * @param res {HttpResponse} Objeto de respuesta HTTP.
 * @return {Promise<void>}
 * @throws {Ninguna} Los errores se empaquetan y retornan en formato JSON.
 */
export async function registerAction(req: HttpRequest, res: HttpResponse) {
  try {
    const body = await readJsonBody<unknown>(req);
    const payload = registerSchema.parse(body);
    const result = await registerUser(payload);

    sendJson(res, 201, {
      ok: true,
      message: result.message,
      account: result.account,
      verification: result.verification,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      sendJson(res, 400, {
        ok: false,
        message: "Datos inválidos",
        errors: error.issues,
      });
      return;
    }

    sendJson(res, getErrorStatus(error), {
      ok: false,
      message: getErrorMessage(error),
    });
  }
}

/**
 * Descripción: Controlador exclusivo para administradores. 
 * Permite crear usuarios directamente con estado activo, saltando el OTP.
 */
export async function adminCreateUserAction(req: HttpRequest, res: HttpResponse) {
  try {
    // 1. Leemos el body permitiendo el campo opcional institution_id
    const body = await readJsonBody<{ 
      full_name: string, 
      email: string, 
      username: string, 
      password: string, 
      role_code: string,
      institution_id?: number | null // 👈 Añadimos el campo aquí
    }>(req);

    // 2. Validación de seguridad "Fail-Fast" (Campos obligatorios)
    if (!body.email || !body.username || !body.password || !body.full_name || !body.role_code) {
      return sendJson(res, 400, { ok: false, message: "Faltan campos obligatorios (nombre, email, usuario, contraseña, rol)." });
    }

    if (body.password.length < 8) {
      return sendJson(res, 400, { ok: false, message: "La contraseña debe tener al menos 8 caracteres por seguridad." });
    }

    // 3. Llamada al servicio
    // Como el servicio usa (...input) y el repositorio ya busca data.institution_id,
    // simplemente pasando el body funcionará correctamente.
    const result = await adminCreateUser(body);

    // 4. Respuesta de éxito
    sendJson(res, 201, {
      ok: true,
      message: result.message,
      user: result.user
    });

  } catch (error) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}