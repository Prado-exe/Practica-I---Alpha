<<<<<<< HEAD
=======
/**
 * ============================================================================
 * MÓDULO: Enrutador de Carga de Archivos (upload.routes.ts)
 * * PROPÓSITO: Gestionar la integración entre el cliente (Frontend) y el 
 * servicio de almacenamiento de objetos (S3 / MinIO).
 * * RESPONSABILIDAD: Actuar como un emisor de permisos temporales ("Pases VIP") 
 * delegando la carga física del archivo al proveedor de almacenamiento.
 * * DECISIONES DE DISEÑO / SUPUESTOS:
 * - Patrón "Direct-to-S3": En lugar de que Node.js reciba el archivo (multipart/form-data) 
 * y actúe como proxy (consumiendo RAM y ancho de banda), el backend solo genera 
 * una URL Criptográfica Prefirmada. El frontend utiliza esta URL para enviar 
 * los bytes directamente al Storage, logrando una escalabilidad masiva y 
 * liberando al servidor principal de tareas de I/O pesadas.
 * ============================================================================
 */
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { HttpRequest, HttpResponse } from "../types/http";
import { sendJson } from "../utils/json";
import { readJsonBody } from "../utils/body";

<<<<<<< HEAD
// Reutilizamos tus funciones de error
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
import { getErrorStatus, getErrorMessage } from "./auth.routes"; 

import { s3Client } from "../config/s3";
import { env } from "../config/env";

<<<<<<< HEAD
export async function generateUploadUrlAction(req: HttpRequest, res: HttpResponse) {
  try {
    // 1. Esperamos que React nos diga qué archivo quiere subir
=======
/**
 * Descripción: Genera y devuelve una URL prefirmada temporal para permitir la subida directa de un archivo al bucket de almacenamiento.
 * POR QUÉ: Se aplica una sanitización estricta (`replace(/\s+/g, '-').toLowerCase()`) y se añade un timestamp (`Date.now()`) al nombre del archivo de forma obligatoria. Esto previene colisiones catastróficas en el bucket en caso de que múltiples usuarios suban archivos con el mismo nombre genérico (ej. "logo.png" o "datos.csv"). El tiempo de expiración corto (300s / 5 min) mitiga riesgos de seguridad si la URL es interceptada.
 * * FLUJO:
 * 1. Extrae el nombre original y el tipo MIME del archivo desde el body.
 * 2. Sanitiza y genera una llave única (storageKey).
 * 3. Solicita al SDK de AWS/S3 una URL prefirmada para operación PUT.
 * 4. Retorna la URL de carga temporal, la URL pública final y la llave de almacenamiento.
 * * @openapi
 * /api/upload/presigned-url:
 * post:
 * summary: Generar URL prefirmada para carga de archivos
 * description: |
 * Emite credenciales temporales en forma de URL para subir un archivo directamente a S3/MinIO. 
 * El cliente debe realizar una petición `PUT` a la `uploadUrl` retornada incluyendo exactamente el mismo archivo físico y el encabezado `Content-Type` declarado.
 * tags:
 * - Almacenamiento (Archivos)
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - fileName
 * - contentType
 * properties:
 * fileName:
 * type: string
 * description: Nombre original del archivo a subir.
 * example: "censo_poblacion_2026.csv"
 * contentType:
 * type: string
 * description: Tipo MIME oficial del archivo.
 * example: "text/csv"
 * responses:
 * 200:
 * description: URL generada exitosamente.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * ok: 
 * type: boolean
 * example: true
 * uploadUrl: 
 * type: string
 * description: URL temporal (5 min) para ejecutar el método PUT con el archivo.
 * fileUrl: 
 * type: string
 * description: URL pública base donde residirá el archivo (usar para previsualización y base de datos).
 * storageKey: 
 * type: string
 * description: Identificador interno del objeto en el bucket.
 * 400:
 * description: Faltan los parámetros requeridos (fileName o contentType).
 * 500:
 * description: Error de conectividad con el servicio S3/MinIO.
 * * @param req {HttpRequest} Objeto de la petición HTTP.
 * @param res {HttpResponse} Objeto de respuesta HTTP.
 * @return {Promise<void>}
 * @throws {Ninguna} Errores atrapados y delegados al manejador de errores global.
 */
export async function generateUploadUrlAction(req: HttpRequest, res: HttpResponse) {
  try {
    
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
    const body = await readJsonBody<{ fileName: string, contentType: string }>(req);

    if (!body.fileName || !body.contentType) {
      return sendJson(res, 400, { ok: false, message: "El nombre (fileName) y tipo (contentType) del archivo son requeridos" });
    }

<<<<<<< HEAD
    // 2. Limpiamos el nombre y le agregamos un timestamp para que sea 100% único y no sobreescriba otros archivos
    const safeFileName = body.fileName.replace(/\s+/g, '-').toLowerCase();
    const uniqueKey = `uploads/${Date.now()}-${safeFileName}`;

    // 3. Preparamos la instrucción para S3/MinIO
=======
    
    const safeFileName = body.fileName.replace(/\s+/g, '-').toLowerCase();
    const uniqueKey = `uploads/${Date.now()}-${safeFileName}`;

   
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
    const command = new PutObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: uniqueKey,
      ContentType: body.contentType,
    });

<<<<<<< HEAD
    // 4. Generamos el "Pase VIP" (URL Prefirmada) válido solo por 5 minutos (300 segundos)
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    // 5. Construimos la URL pública final donde vivirá la imagen para que la guardes en tu base de datos
    // Nota: Esta estructura de URL aplica para MinIO local. En S3 de Amazon real cambia ligeramente.
    const fileUrl = `${env.S3_ENDPOINT}/${env.S3_BUCKET_NAME}/${uniqueKey}`;

    // 6. Le devolvemos ambas rutas al frontend
    sendJson(res, 200, {
      ok: true,
      uploadUrl: presignedUrl, // React usará ESTA para subir el archivo físicamente
      fileUrl: fileUrl,         // Y React usará ESTA para mostrar la imagen en pantalla y mandarla a PostgreSQL
=======
  
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    
    const fileUrl = `${env.S3_ENDPOINT}/${env.S3_BUCKET_NAME}/${uniqueKey}`;

   
    sendJson(res, 200, {
      ok: true,
      uploadUrl: presignedUrl, 
      fileUrl: fileUrl,        
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
      storageKey: uniqueKey
    });

  } catch (error) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}