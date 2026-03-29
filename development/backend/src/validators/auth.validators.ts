<<<<<<< HEAD
import { z } from "zod";

=======
/**
 * ============================================================================
 * MÓDULO: Esquemas de Validación de Autenticación (auth.validators.ts)
 * * PROPÓSITO: Definir las reglas de integridad y transformación para los 
 * datos de entrada en los procesos de identidad.
 * * RESPONSABILIDAD: Actuar como el contrato de datos entre el cliente y el 
 * servidor, asegurando que solo información saneada y válida llegue a los servicios.
 * * DECISIONES DE DISEÑO / SUPUESTOS:
 * - Normalización Automática: Se implementa `.transform()` en todos los campos 
 * de correo electrónico para aplicar `.trim().toLowerCase()` de forma 
 * obligatoria. Esto previene errores de duplicidad 
 * en la base de datos causados por mayúsculas accidentales o espacios al 
 * final del texto, garantizando que 'Usuario@Email.com' y 'usuario@email.com' 
 * sean tratados como la misma entidad.
 * - Validación Basada en Esquemas (Zod): Se prefiere Zod para obtener tipado 
 * estático automático (TypeScript) a partir de los esquemas de validación, 
 * reduciendo la discrepancia entre el código y las reglas de negocio.
 * ============================================================================
 */
import { z } from "zod";

/**
 * Descripción: Define las reglas para el registro de nuevos usuarios.
 * POR QUÉ: Impone un límite de seguridad en la longitud del nombre (120) y correo (150) para prevenir ataques de denegación de servicio (DoS) por payloads excesivamente grandes que podrían saturar el procesamiento de strings o la memoria de la base de datos. La contraseña tiene un mínimo de 8 caracteres siguiendo las recomendaciones modernas de OWASP.
 * @param input {RegisterSchemaInput} Objeto con name, email y password.
 * @return {ZodObject} Esquema validado y transformado.
 * @throws {ZodError} Si los campos no cumplen con las restricciones de longitud o formato.
 */
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
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

<<<<<<< HEAD
=======
/**
 * Descripción: Valida las credenciales de acceso durante el inicio de sesión.
 * POR QUÉ: A diferencia del registro, aquí la contraseña solo exige `min(1)` para ser obligatoria. No se validan longitudes máximas complejas en este punto para agilizar el proceso de "Fail-Fast" en la capa de red antes de realizar el hash de la clave en el servicio.
 * @param input {LoginSchemaInput} Credenciales del usuario.
 * @return {ZodObject} Esquema con email normalizado.
 * @throws {ZodError} Si el formato del correo es inválido.
 */
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export const loginSchema = z.object({
  email: z
    .string()
    .email("Correo inválido")
    .transform((value) => value.trim().toLowerCase()),
  password: z
    .string()
    .min(1, "La contraseña es obligatoria"),
});

<<<<<<< HEAD
=======
/**
 * Descripción: Esquema para la validación de códigos de verificación OTP (One-Time Password).
 * POR QUÉ: Utiliza una expresión regular (`/^\d{6}$/`) para asegurar que el código sea estrictamente de 6 dígitos numéricos. Esta restricción previene que el backend intente realizar consultas costosas a la base de datos con tokens mal formados o inyecciones de texto que no coinciden con el formato OTP generado por el sistema.
 * @param input {VerifyCodeSchemaInput} Email y código de 6 dígitos.
 * @return {ZodObject} Esquema validado.
 * @throws {ZodError} Si el código contiene letras o no tiene exactamente 6 caracteres.
 */
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
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

<<<<<<< HEAD
=======
/**
 * Descripción: Valida la solicitud para re-emitir un código de verificación.
 * POR QUÉ: Es un esquema minimalista diseñado para mitigar el abuso de la función de envío de correos. Al validar el formato y la longitud máxima (160) en esta capa, evitamos disparar lógica de negocio o servicios de terceros (SMTP/SES) con direcciones de correo que son estructuralmente inválidas.
 * @param input {email: string} Correo electrónico del destinatario.
 * @return {ZodObject} Esquema con email normalizado.
 * @throws {ZodError} Si el correo es inválido.
 */
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export const resendVerificationSchema = z.object({
  email: z.string().trim().email("Correo inválido").max(160),
});