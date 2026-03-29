<<<<<<< HEAD
/**
 * ============================================================================
 * MÓDULO: Utilidades de Tokens Criptográficos (token.ts)
 * * PROPÓSITO: Proveer herramientas para la creación y almacenamiento seguro 
 * de tokens de alta entropía (recuperación de clave, verificación de email).
 * * RESPONSABILIDAD: Garantizar que los tokens generados sean impredecibles y 
 * que su persistencia en la base de datos no comprometa la seguridad del 
 * usuario en caso de una filtración de datos.
 * * DECISIONES DE DISEÑO / SUPUESTOS:
 * - Almacenamiento "Hashed": Siguiendo el principio de defensa en profundidad, 
 * los tokens nunca se guardan en texto plano. Se aplica una función hash 
 * antes de la inserción en BD, de modo que un atacante con acceso a las tablas 
 * no pueda reconstruir los enlaces de recuperación válidos.
 * ============================================================================
 */
import crypto from "crypto";

/**
 * Descripción: Genera una cadena aleatoria hexadecimal utilizando un generador de números pseudoaleatorios criptográficamente seguro (CSPRNG).
 * POR QUÉ: Se utiliza el módulo `crypto` nativo de Node.js en lugar de `Math.random()` porque este último es predecible y vulnerable a ataques de fuerza bruta. El valor por defecto de 32 bytes genera una cadena de 64 caracteres, lo que proporciona una colisión prácticamente imposible para identificadores únicos globales.
 * @param bytes {number} Cantidad de bytes de entropía a generar (por defecto 32).
 * @return {string} Representación hexadecimal del token.
 * @throws {Error} Si el sistema no dispone de suficiente entropía acumulada para generar bytes seguros.
=======
import crypto from "crypto";

/**
 * Genera un token aleatorio criptográficamente seguro.
 * @param bytes Longitud en bytes (por defecto 32 bytes = 64 caracteres hex)
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
 */
export function generateSecureToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

/**
<<<<<<< HEAD
 * Descripción: Transforma un token de texto plano en un hash SHA-256.
 * POR QUÉ: Esta función actúa como una caja negra de una sola vía. Al usar SHA-256, nos aseguramos de que incluso si la base de datos es comprometida, los tokens activos no puedan ser utilizados por un tercero. Dado que los tokens generados por `generateSecureToken` ya poseen una alta entropía, no es estrictamente necesario el uso de sales (salts) adicionales como ocurre con las contraseñas de usuario.
 * @param token {string} El token original generado para el usuario.
 * @return {string} El resumen (digest) hexadecimal del token para almacenamiento.
 * @throws {Ninguna} Operación síncrona determinista.
=======
 * Aplica un hash SHA-256 a un token para guardarlo de forma segura en la BD.
 * @param token El token original en texto plano
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
 */
export function hashSecureToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}