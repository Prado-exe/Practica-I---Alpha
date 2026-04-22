"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.warmupMailer = warmupMailer;
exports.getMailerHealth = getMailerHealth;
exports.sendVerificationEmail = sendVerificationEmail;
exports.sendPasswordResetEmail = sendPasswordResetEmail;
/**
 * ============================================================================
 * MÓDULO: Servicio de Mensajería SMTP (mailer.ts)
 * * PROPÓSITO: Gestionar el envío de correos electrónicos transaccionales
 * (verificación, recuperación de cuenta).
 * * RESPONSABILIDAD: Abstraer la configuración de Nodemailer, gestionar el
 * estado de salud de la conexión SMTP y proveer plantillas predefinidas.
 * * DECISIONES DE DISEÑO / SUPUESTOS:
 * - Fail-Safe Proactivo: El sistema incluye un mecanismo de "warmup" para
 * validar la conectividad con el servidor de correo durante el arranque del
 * sistema, evitando que los errores de red se descubran solo cuando un
 * usuario intenta registrarse.
 * - Resiliencia: Antes de cada envío, se verifica la disponibilidad del
 * transporte. Si el servicio se cayó tras el inicio, el sistema intentará
 * reconectarse una vez antes de fallar la petición del usuario.
 * ============================================================================
 */
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = require("../config/env");
const transporter = nodemailer_1.default.createTransport({
    host: env_1.env.SMTP_HOST,
    port: env_1.env.SMTP_PORT,
    secure: env_1.env.SMTP_PORT === 465,
    auth: {
        user: env_1.env.SMTP_USER,
        pass: env_1.env.SMTP_PASS,
    },
});
let mailerReady = false;
let lastMailerError = null;
/**
 * Descripción: Realiza una verificación de apretón de manos (handshake) con el servidor SMTP.
 * POR QUÉ: Se separa de la creación del transporte para permitir que el
 * servidor inicie incluso si el SMTP es temporalmente inalcanzable, marcando
 * el servicio como no disponible en lugar de bloquear todo el proceso de Node.js.
 * * FLUJO:
 * 1. Invoca el método `verify()` de Nodemailer.
 * 2. Actualiza los flags globales de estado y limpia errores previos si tiene éxito.
 * 3. Captura y registra la causa técnica exacta del fallo en caso de error.
 * @return {Promise<void>}
 * @throws {Ninguna} Los errores se capturan internamente para gestionar el estado de salud.
 */
async function warmupMailer() {
    try {
        await transporter.verify();
        mailerReady = true;
        lastMailerError = null;
        console.log("SMTP listo");
    }
    catch (error) {
        mailerReady = false;
        lastMailerError =
            error instanceof Error ? error.message : "SMTP verification failed";
        console.error("SMTP no disponible al iniciar:", lastMailerError);
    }
}
/**
 * Descripción: Expone el estado actual del servicio de mensajería para monitoreo.
 * POR QUÉ: Permite que endpoints de "Health Check" o el panel administrativo
 * consulten si el sistema puede enviar correos sin intentar un envío real,
 * facilitando el diagnóstico preventivo de infraestructura.
 * @return {{ ready: boolean, lastError: string | null }} Objeto con el estado y el último error registrado.
 */
function getMailerHealth() {
    return {
        ready: mailerReady,
        lastError: lastMailerError,
    };
}
/**
 * Descripción: Asegura que existe una conexión activa antes de proceder con un envío.
 * POR QUÉ: Actúa como un guardián de flujo. Si el servicio no está listo,
 * intenta un nuevo "warmup" (reconexión tardía). Esto recupera el servicio
 * automáticamente si el servidor SMTP estuvo caído durante el arranque pero
 * volvió a estar en línea después.
 * @return {Promise<void>}
 * @throws {Error} Si tras el intento de reconexión el servicio sigue fallando.
 */
async function ensureMailerReady() {
    if (mailerReady) {
        return;
    }
    await warmupMailer();
    if (!mailerReady) {
        throw new Error(lastMailerError ?? "Servicio de correo no disponible");
    }
}
/**
 * Descripción: Envía el código OTP para la validación de cuenta nueva.
 * POR QUÉ: Utiliza una plantilla minimalista con soporte para texto plano y
 * HTML, asegurando que el código sea legible en cualquier cliente de correo,
 * incluso aquellos con bloqueos estrictos de contenido enriquecido.
 * @param to {string} Dirección de correo del destinatario.
 * @param code {string} Código numérico de 6 dígitos generado por el sistema.
 * @return {Promise<void>}
 * @throws {Error} Si el transporte SMTP falla o el destinatario es rechazado.
 */
async function sendVerificationEmail(to, code) {
    await ensureMailerReady();
    await transporter.sendMail({
        from: env_1.env.SMTP_FROM,
        to,
        subject: "Código de verificación",
        text: `Tu código de verificación es: ${code}`,
        html: `<p>Tu código de verificación es:</p><h2>${code}</h2>`,
    });
}
/**
 * Descripción: Envía un correo estructurado con un botón de acción para restablecer la contraseña.
 * POR QUÉ: Incluye un diseño HTML con estilos in-line para garantizar la
 * consistencia visual en clientes como Outlook y Gmail. Se añade una
 * advertencia explícita sobre la expiración de 15 minutos para gestionar las
 * expectativas de seguridad del usuario y reducir tickets de soporte por links caducados.
 * * FLUJO:
 * 1. Valida la salud del mailer.
 * 2. Inyecta el link dinámico en el botón de la plantilla HTML.
 * 3. Envía el correo utilizando el remitente configurado en las variables de entorno.
 * @param to {string} Correo del usuario solicitante.
 * @param resetLink {string} URL completa con el token de seguridad único.
 * @return {Promise<void>}
 * @throws {Error} Si la infraestructura de correo no responde.
 */
async function sendPasswordResetEmail(to, resetLink) {
    await ensureMailerReady();
    await transporter.sendMail({
        from: env_1.env.SMTP_FROM,
        to,
        subject: "Recuperación de Contraseña - Observatorio de Datos",
        text: `Has solicitado recuperar tu contraseña. Copia y pega este enlace en tu navegador: ${resetLink} \n\nEste enlace expirará en 15 minutos.`,
        html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
        <h2 style="color: #004080; text-align: center;">Recuperación de Contraseña</h2>
        <p>Hola,</p>
        <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta. Si fuiste tú, haz clic en el botón de abajo:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #004080; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Restablecer mi contraseña</a>
        </div>
        <p><em>Este enlace caducará por seguridad en 15 minutos.</em></p>
        <p style="font-size: 0.9em; color: #666;">Si no solicitaste este cambio, ignora este correo. Tu cuenta seguirá segura.</p>
      </div>
    `,
    });
}
