<<<<<<< HEAD
/**
 * ============================================================================
 * MÓDULO: Utilidades de Criptografía de Contraseñas (password.ts)
 * * PROPÓSITO: Centralizar la lógica de protección de credenciales mediante 
 * algoritmos de hashing adaptativos.
 * * RESPONSABILIDAD: Proveer métodos para la transformación segura de 
 * contraseñas en texto plano y su posterior validación contra hashes persistidos.
 * * DECISIONES DE DISEÑO / SUPUESTOS:
 * - Uso de bcrypt: Se selecciona esta librería por su capacidad intrínseca de 
 * mitigar ataques de fuerza bruta y tablas Rainbow mediante el uso de sales 
 * (salts) y un factor de costo ajustable.
 * - Factor de Costo (SALT_ROUNDS): Se establece en 12. Es un balance de diseño 
 * entre la seguridad (tiempo necesario para computar el hash) y el rendimiento 
 * del servidor (latencia en el login), cumpliendo con los estándares actuales 
 * para hardware de propósito general.
 * ============================================================================
 */
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

<<<<<<< HEAD
/**
 * Descripción: Genera un hash seguro y unidireccional a partir de una contraseña.
 * POR QUÉ: Utiliza `bcrypt.hash` con un factor de 12 para asegurar que, incluso 
 * si la base de datos es comprometida, la reconstrucción de la contraseña 
 * original sea computacionalmente inviable para un atacante. El proceso 
 * genera automáticamente un salt único por cada llamada, garantizando que dos 
 * usuarios con la misma contraseña tengan hashes finales diferentes.
 * @param {string} password La contraseña en texto plano proporcionada por el usuario.
 * @return {Promise<string>} El hash resultante listo para ser almacenado en la base de datos.
 * @throws {Error} Si el motor de bcrypt encuentra fallos de entropía o errores internos.
 */
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

<<<<<<< HEAD
/**
 * Descripción: Valida una contraseña en texto plano contra un hash previamente almacenado.
 * POR QUÉ: Se utiliza `bcrypt.compare` para mitigar ataques de tiempo (timing attacks). La función implementa comparaciones en tiempo constante, evitando que un atacante deduzca información sobre el hash basándose en cuánto tarda el servidor en responder. Además, la función extrae automáticamente el salt del hash proporcionado, simplificando la lógica de verificación.
 * @param {string} password La contraseña enviada durante el intento de acceso.
 * @param {string} passwordHash El hash de referencia recuperado de la persistencia.
 * @return {Promise<boolean>} Retorna `true` si la contraseña es válida, `false` en caso contrario.
 * @throws {Error} Ante fallos en el proceso de comparación criptográfica.
 */
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function comparePassword(
  password: string,
  passwordHash: string
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}