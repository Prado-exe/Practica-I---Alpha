"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyEmailAction = verifyEmailAction;
exports.resendVerificationAction = resendVerificationAction;
const body_1 = require("../utils/body");
const json_1 = require("../utils/json");
const zod_1 = require("zod");
const auth_validators_1 = require("../validators/auth.validators");
const auth_service_1 = require("../services/auth.service");
const auth_routes_1 = require("./auth.routes");
/**
 * Descripción: Controlador para procesar la confirmación de una cuenta mediante un código OTP de 6 dígitos.
 * POR QUÉ: La validación del esquema (Zod) en esta capa previene que la base de datos o las funciones criptográficas intenten procesar payloads vacíos, inyecciones o correos mal formados. Devuelve una bandera `valid` explícita en el JSON para facilitar la construcción de interfaces condicionales en el frontend (ej. mostrar check verde o aspa roja).
 * * FLUJO:
 * 1. Lee y parsea el body de la petición HTTP.
 * 2. Ejecuta validación estricta de formato (`verifyCodeSchema`).
 * 3. Llama al servicio para quemar el OTP y activar la cuenta (o liberarla de revalidación).
 * 4. Captura errores de validación de Zod (400) o de reglas de negocio (404, 429, 401).
 * * @openapi
 * /api/verificar:
 * post:
 * summary: Validar código de verificación OTP
 * description: |
 * Verifica el código de 6 dígitos enviado al correo del usuario. Este endpoint es dual: sirve tanto para activar cuentas nuevas ("Nuevos Registros") como para desbloquear cuentas ("Trampa de Revalidación").
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
 * - codigo
 * properties:
 * email:
 * type: string
 * format: email
 * example: "usuario@institucion.com"
 * codigo:
 * type: string
 * example: "123456"
 * responses:
 * 200:
 * description: Código válido. Cuenta verificada o revalidada exitosamente.
 * 400:
 * description: Código incorrecto, expirado, o ya utilizado. Datos inválidos.
 * 404:
 * description: Cuenta no encontrada o sin códigos pendientes.
 * 429:
 * description: Demasiados intentos fallidos. El código ha sido bloqueado temporalmente.
 * * @param req {HttpRequest} Objeto de la petición HTTP.
 * @param res {HttpResponse} Objeto de respuesta HTTP.
 * @return {Promise<void>}
 * @throws {Ninguna} Los errores se empaquetan en respuestas HTTP.
 */
async function verifyEmailAction(req, res) {
    try {
        const body = await (0, body_1.readJsonBody)(req);
        const payload = auth_validators_1.verifyCodeSchema.parse(body);
        const result = await (0, auth_service_1.verifyEmailCode)(payload);
        (0, json_1.sendJson)(res, 200, result);
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            (0, json_1.sendJson)(res, 400, {
                valid: false,
                message: "Datos inválidos",
                errors: error.issues,
            });
            return;
        }
        (0, json_1.sendJson)(res, (0, auth_routes_1.getErrorStatus)(error), {
            valid: false,
            message: (0, auth_routes_1.getErrorMessage)(error),
        });
    }
}
/**
 * Descripción: Controlador para solicitar la emisión y envío de un nuevo código OTP al correo del usuario.
 * POR QUÉ: En este endpoint la capa de validación (`resendVerificationSchema`) es crítica para asegurar que el sistema no intente enviar correos a cadenas que no sean direcciones válidas, lo cual afectaría la reputación del servidor SMTP (AWS SES / Nodemailer). La respuesta exitosa siempre es genérica (200) para evitar enumeración.
 * * FLUJO:
 * 1. Extrae el correo del cuerpo de la petición.
 * 2. Verifica que tenga formato de email válido.
 * 3. Delega al servicio la invalidación de códigos anteriores y generación del nuevo.
 * * @openapi
 * /api/verificar/reenviar:
 * post:
 * summary: Solicitar un nuevo código de verificación
 * description: |
 * Invalida los códigos anteriores pendientes y emite un nuevo OTP de 6 dígitos enviándolo por correo electrónico. Implementa políticas de "Cooldown" (espera mínima de 60s) y límite máximo de reenvíos por diseño.
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
 * description: Éxito genérico. "Si el correo existe, se enviará un nuevo código".
 * 400:
 * description: Formato de correo inválido.
 * 429:
 * description: Exceso de peticiones. Debe esperar (cooldown) o se superó el límite de reenvíos permitidos.
 * * @param req {HttpRequest} Objeto de la petición HTTP.
 * @param res {HttpResponse} Objeto de respuesta HTTP.
 * @return {Promise<void>}
 * @throws {Ninguna} Los errores se mapean directamente al cuerpo de la respuesta.
 */
async function resendVerificationAction(req, res) {
    try {
        const body = await (0, body_1.readJsonBody)(req);
        const payload = auth_validators_1.resendVerificationSchema.parse(body);
        const result = await (0, auth_service_1.resendVerificationCode)(payload.email);
        (0, json_1.sendJson)(res, 200, {
            ok: true,
            message: result.message,
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
