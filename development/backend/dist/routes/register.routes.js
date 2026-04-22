"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAction = registerAction;
const body_1 = require("../utils/body");
const json_1 = require("../utils/json");
const zod_1 = require("zod");
const auth_validators_1 = require("../validators/auth.validators");
const auth_service_1 = require("../services/auth.service");
const auth_routes_1 = require("./auth.routes");
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
async function registerAction(req, res) {
    try {
        const body = await (0, body_1.readJsonBody)(req);
        const payload = auth_validators_1.registerSchema.parse(body);
        const result = await (0, auth_service_1.registerUser)(payload);
        (0, json_1.sendJson)(res, 201, {
            ok: true,
            message: result.message,
            account: result.account,
            verification: result.verification,
        });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            (0, json_1.sendJson)(res, 400, {
                ok: false,
                message: "Datos inválidos",
                errors: error.issues,
            });
            return;
        }
        (0, json_1.sendJson)(res, (0, auth_routes_1.getErrorStatus)(error), {
            ok: false,
            message: (0, auth_routes_1.getErrorMessage)(error),
        });
    }
}
