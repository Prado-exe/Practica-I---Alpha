const { z } = require("zod");

const registerSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  email: z.string().email("Correo inválido"),
  institution: z.string().optional().or(z.literal("")),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

const loginSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

const verifyCodeSchema = z.object({
  email: z.string().email("Correo inválido"),
  codigo: z.string().min(4, "Código inválido").max(10, "Código inválido"),
});

module.exports = {
  registerSchema,
  loginSchema,
  verifyCodeSchema,
};

