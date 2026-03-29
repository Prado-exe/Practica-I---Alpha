<<<<<<< HEAD
/**
 * ============================================================================
 * MÓDULO: Cliente de Almacenamiento S3 (s3.ts)
 * * PROPÓSITO: Configurar e inicializar el cliente oficial de AWS SDK para la 
 * gestión de archivos y objetos.
 * * RESPONSABILIDAD: Proveer una interfaz de conexión centralizada hacia el 
 * servicio de almacenamiento, ya sea en la nube de AWS o en instancias locales.
 * * DECISIONES DE DISEÑO / SUPUESTOS:
 * - Abstracción de Proveedor: El cliente se configura de forma agnóstica 
 * mediante variables de entorno, permitiendo alternar entre Amazon S3 y MinIO 
 * (u otros proveedores compatibles con la API de S3) sin modificar la lógica 
 * del sistema.
 * - Seguridad de Credenciales: Se asume que el objeto `env` ya ha validado 
 * la presencia de las llaves de acceso antes de la inicialización de este cliente.
 * ============================================================================
 */
import { S3Client } from "@aws-sdk/client-s3";
import { env } from "./env"; 

/**
 * Descripción: Instancia compartida (Singleton) del cliente S3 para toda la aplicación.
 * POR QUÉ: Se implementa la bandera `forcePathStyle: true` como una decisión 
 * crítica de arquitectura. Mientras que el SDK de AWS intenta por defecto usar 
 * el estilo de "Virtual Hosting" (ej: bucket.s3.amazon.com), MinIO y la 
 * mayoría de las implementaciones autohospedadas requieren el estilo de "Ruta" 
 * (ej: localhost:9000/bucket) para el correcto enrutamiento de las peticiones. 
 * El uso del `endpoint` personalizado permite que el tráfico se redirija 
 * mágicamente a la infraestructura local durante el desarrollo, manteniendo 
 * el mismo comportamiento que en producción.
 */

export const s3Client = new S3Client({
  endpoint: env.S3_ENDPOINT, 
=======
import { S3Client } from "@aws-sdk/client-s3";
import { env } from "./env"; // Tu archivo de variables de entorno

export const s3Client = new S3Client({
  endpoint: env.S3_ENDPOINT, // ESTA es la magia que lo redirige a tu MinIO local
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
  region: env.S3_REGION,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_KEY,
  },
<<<<<<< HEAD
=======
  // ¡CRÍTICO PARA MINIO! AWS usa "bucket.url.com", MinIO usa "url.com/bucket"
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
  forcePathStyle: true, 
});