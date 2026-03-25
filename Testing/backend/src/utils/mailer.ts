import nodemailer from "nodemailer";
import { env } from "../config/env";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

let mailerReady = false;
let lastMailerError: string | null = null;

export async function warmupMailer(): Promise<void> {
  try {
    await transporter.verify();
    mailerReady = true;
    lastMailerError = null;
    console.log("SMTP listo");
  } catch (error) {
    mailerReady = false;
    lastMailerError =
      error instanceof Error ? error.message : "SMTP verification failed";
    console.error("SMTP no disponible al iniciar:", lastMailerError);
  }
}

export function getMailerHealth() {
  return {
    ready: mailerReady,
    lastError: lastMailerError,
  };
}

async function ensureMailerReady(): Promise<void> {
  if (mailerReady) {
    return;
  }

  await warmupMailer();

  if (!mailerReady) {
    throw new Error(lastMailerError ?? "Servicio de correo no disponible");
  }
}

export async function sendVerificationEmail(
  to: string,
  code: string
): Promise<void> {
  await ensureMailerReady();

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject: "Código de verificación",
    text: `Tu código de verificación es: ${code}`,
    html: `<p>Tu código de verificación es:</p><h2>${code}</h2>`,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  resetLink: string
): Promise<void> {
  await ensureMailerReady();

  await transporter.sendMail({
    from: env.SMTP_FROM,
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