/**
 * ============================================================================
 * MÓDULO: Configuración de Base de Datos (db.ts)
 * * PROPÓSITO: Inicializar y centralizar el acceso a la instancia de 
 * PostgreSQL.
 * * RESPONSABILIDAD: Proveer una instancia compartida del pool de conexiones 
 * para toda la aplicación y validar la conectividad durante el arranque (bootstrap).
 * * DECISIONES DE DISEÑO / SUPUESTOS:
 * - Uso de Pool: Se implementa `pg.Pool` en lugar de clientes individuales para 
 * optimizar el rendimiento mediante la reutilización de conexiones TCP ya 
 * establecidas, evitando el costo de latencia de nuevos handshakes en cada 
 * petición HTTP.
 * - Configuración Centralizada: Depende estrictamente del objeto `env` para 
 * garantizar que las credenciales no estén hardcodeadas y cambien dinámicamente 
 * entre entornos (desarrollo, producción).
 * ============================================================================
 */
import { Pool } from "pg";
import { env } from "./env";

/**
 * Descripción: Instancia global del pool de conexiones de PostgreSQL.
 * POR QUÉ: Al ser exportada como una constante, actúa como un Singleton de facto. 
 * Esto asegura que toda la aplicación comparta el mismo límite de conexiones 
 * configurado, permitiendo al controlador de `pg` gestionar la cola de peticiones 
 * de forma eficiente cuando el tráfico es alto.
 */
export const pool = new Pool({
  host: env.DB_HOST_POSTGRES,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASS,
  database: env.DB_NAME,
});

/**
 * Descripción: Ejecuta una consulta de verificación rápida para validar la salud de la conexión.
 * POR QUÉ: Se utiliza como "Health Check" crítico durante la inicialización del servidor. Ejecuta un `SELECT 1` (la consulta más ligera posible) para confirmar que las credenciales son correctas y el servidor de BD es alcanzable antes de que la aplicación comience a aceptar tráfico HTTP, evitando errores en cascada en los controladores.
 * @param {void} No requiere parámetros.
 * @return {Promise<void>} Promesa que se resuelve si la conexión es exitosa.
 * @throws {Error} Si el pool no puede obtener un cliente o la consulta falla, deteniendo el arranque seguro del sistema.
 */
export async function testDbConnection(): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query("SELECT 1");
    console.log("Base de datos PostgreSQL conectada");
  } finally {
    client.release();
  }
}