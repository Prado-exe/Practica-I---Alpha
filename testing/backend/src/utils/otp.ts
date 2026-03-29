<<<<<<< HEAD
/**
 * ============================================================================
 * MÓDULO: Utilidades de Código OTP (otp.ts)
 * * PROPÓSITO: Proveer herramientas para la generación y protección de 
 * códigos One-Time Password (OTP).
 * * RESPONSABILIDAD: Garantizar la creación de códigos numéricos impredecibles 
 * y su transformación segura para persistencia en base de datos.
 * * DECISIONES DE DISEÑO / SUPUESTOS:
 * - Seguridad Criptográfica: Se utiliza el módulo `crypto` nativo para 
 * asegurar que los códigos no sigan patrones predecibles, algo vital para 
 * evitar ataques de fuerza bruta en el proceso de verificación de identidad.
 * - Almacenamiento Ciego: Al igual que las contraseñas, los OTP se hashean 
 * antes de guardarse. Esto evita que un administrador con acceso a la BD 
 * o un atacante puedan interceptar códigos vigentes en texto plano.
 * ============================================================================
 */
import { createHash, randomInt } from "crypto";

/**
 * Descripción: Genera una cadena numérica aleatoria de longitud específica (por defecto 6).
 * POR QUÉ: Se opta por `randomInt(0, 10)` en lugar de métodos basados en `Math.random()` porque este último no es adecuado para seguridad. El uso de dígitos (0-9) facilita la usabilidad para el usuario final al leer y transcribir el código desde su correo o dispositivo móvil sin ambigüedad de caracteres.
 * @param length {number} Longitud deseada del código (por defecto 6).
 * @return {string} Cadena de texto que representa el código numérico.
 * @throws {Error} Si el motor criptográfico falla por falta de entropía en el sistema.
 */
=======
import { createHash, randomInt } from "crypto";

>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export function generateOtpCode(length = 6): string {
  let code = "";

  for (let i = 0; i < length; i += 1) {
    code += randomInt(0, 10).toString();
  }

  return code;
}

<<<<<<< HEAD
/**
 * Descripción: Aplica un resumen SHA-256 a un código OTP para su almacenamiento seguro.
 * POR QUÉ: Los OTP son credenciales temporales pero críticas. Utilizar SHA-256 asegura que el valor en la base de datos sea inútil si es extraído, requiriendo que el usuario proporcione el código original para que el sistema realice la comparación de hashes. No requiere salt adicional dado que la corta vida útil del token y su naturaleza aleatoria mitigan el riesgo de tablas de búsqueda (rainbow tables).
 * @param code {string} El código OTP en texto plano generado previamente.
 * @return {string} El hash hexadecimal del código.
 * @throws {Ninguna} Operación determinista síncrona.
 */
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export function hashOtpCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}