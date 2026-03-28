import type { HttpRequest, HttpResponse } from "../types/http";
import { readJsonBody } from "../utils/body";
import { sendJson } from "../utils/json";
import { ZodError } from "zod";
import { registerSchema } from "../validators/auth.validators";
import { registerUser } from "../services/auth.service";
import { getErrorStatus, getErrorMessage } from "./auth.routes";

/**
 * Controlador para el registro de nuevos usuarios (Módulo de Autenticación).
 * * FLUJO DE EJECUCIÓN:
 * 1. Recepción y Validación: Parsea el cuerpo JSON y valida los datos de entrada estrictamente contra `registerSchema`.
 * 2. Procesamiento de Negocio: Llama a `registerUser` para encriptar la contraseña y guardar la cuenta en la base de datos.
 * 3. Gestión de Verificación: Prepara el estado de verificación inicial del usuario (ej. token para confirmar correo electrónico).
 * 4. Emisión de Respuesta: Devuelve un estado HTTP 201 (Creado) con la información pública de la cuenta y los detalles de verificación.
 * 5. Intercepción de Errores: Captura específicamente `ZodError` para devolver un estado 400 detallando exactamente qué campos fallaron, o delega al manejador global para otros errores (como un correo ya registrado).
 * * @openapi
 * /api/register:
 * post:
 * summary: Registrar una nueva cuenta de usuario
 * description: |
 * **Flujo de Registro de Cuenta**
 * * Crea un nuevo usuario en el sistema. Los datos de entrada pasan por una validación estricta (Zod).
 * Si el registro es exitoso, el sistema devuelve los datos públicos de la cuenta recién creada
 * y los detalles sobre su estado de verificación (por ejemplo, si se requiere confirmar el correo).
 * * *Nota de Seguridad:* Este endpoint **no** inicia la sesión automáticamente ni devuelve un Token JWT. El usuario debe hacer login de forma explícita o confirmar su cuenta posteriormente.
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
 * description: Datos inválidos. Falló la validación del esquema (ej. contraseña muy corta, formato de correo inválido). Devuelve un array con los campos específicos que fallaron.
 * 409:
 * description: Conflicto. El correo electrónico ya se encuentra registrado en el sistema.
 * 500:
 * description: Error interno del servidor.
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