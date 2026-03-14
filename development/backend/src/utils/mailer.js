const nodemailer = require("nodemailer");
const env = require("../config/env");

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: Number(env.SMTP_PORT),
  secure: Number(env.SMTP_PORT) === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

async function sendVerificationEmail(to, code) {
  await transporter.verify();

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject: "Código de verificación",
    text: `Tu código de verificación es: ${code}`,
    html: `<p>Tu código de verificación es:</p><h2>${code}</h2>`,
  });
}

module.exports = { sendVerificationEmail };