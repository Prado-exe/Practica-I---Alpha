import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(120, "El nombre es demasiado largo"),
  email: z
    .string()
    .email("Correo inválido")
    .max(150, "El correo es demasiado largo")
    .transform((value) => value.trim().toLowerCase()),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(128, "La contraseña es demasiado larga"),
});

export const loginSchema = z.object({
  email: z
    .string()
    .email("Correo inválido")
    .transform((value) => value.trim().toLowerCase()),
  password: z
    .string()
    .min(1, "La contraseña es obligatoria"),
});

export const verifyCodeSchema = z.object({
  email: z
    .string()
    .email("Correo inválido")
    .transform((value) => value.trim().toLowerCase()),
  codigo: z
    .string()
    .regex(/^\d{6}$/, "El código debe tener 6 dígitos"),
});

export type RegisterSchemaInput = z.infer<typeof registerSchema>;
export type LoginSchemaInput = z.infer<typeof loginSchema>;
export type VerifyCodeSchemaInput = z.infer<typeof verifyCodeSchema>;

export const resendVerificationSchema = z.object({
  email: z.string().trim().email("Correo inválido").max(160),
});