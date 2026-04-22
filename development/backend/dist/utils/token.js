"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSecureToken = generateSecureToken;
exports.hashSecureToken = hashSecureToken;
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
const crypto_1 = __importDefault(require("crypto"));
/**
 * Descripción: Genera una cadena aleatoria hexadecimal utilizando un generador de números pseudoaleatorios criptográficamente seguro (CSPRNG).
 * POR QUÉ: Se utiliza el módulo `crypto` nativo de Node.js en lugar de `Math.random()` porque este último es predecible y vulnerable a ataques de fuerza bruta. El valor por defecto de 32 bytes genera una cadena de 64 caracteres, lo que proporciona una colisión prácticamente imposible para identificadores únicos globales.
 * @param bytes {number} Cantidad de bytes de entropía a generar (por defecto 32).
 * @return {string} Representación hexadecimal del token.
 * @throws {Error} Si el sistema no dispone de suficiente entropía acumulada para generar bytes seguros.
 */
function generateSecureToken(bytes = 32) {
    return crypto_1.default.randomBytes(bytes).toString("hex");
}
/**
 * Descripción: Transforma un token de texto plano en un hash SHA-256.
 * POR QUÉ: Esta función actúa como una caja negra de una sola vía. Al usar SHA-256, nos aseguramos de que incluso si la base de datos es comprometida, los tokens activos no puedan ser utilizados por un tercero. Dado que los tokens generados por `generateSecureToken` ya poseen una alta entropía, no es estrictamente necesario el uso de sales (salts) adicionales como ocurre con las contraseñas de usuario.
 * @param token {string} El token original generado para el usuario.
 * @return {string} El resumen (digest) hexadecimal del token para almacenamiento.
 * @throws {Ninguna} Operación síncrona determinista.
 */
function hashSecureToken(token) {
    return crypto_1.default.createHash("sha256").update(token).digest("hex");
}
