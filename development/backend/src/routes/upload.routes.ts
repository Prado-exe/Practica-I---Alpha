import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { HttpRequest, HttpResponse } from "../types/http";
import { sendJson } from "../utils/json";
import { readJsonBody } from "../utils/body";

// Reutilizamos tus funciones de error
import { getErrorStatus, getErrorMessage } from "./auth.routes"; 

import { s3Client } from "../config/s3";
import { env } from "../config/env";

export async function generateUploadUrlAction(req: HttpRequest, res: HttpResponse) {
  try {
    // 1. Esperamos que React nos diga qué archivo quiere subir
    const body = await readJsonBody<{ fileName: string, contentType: string }>(req);

    if (!body.fileName || !body.contentType) {
      return sendJson(res, 400, { ok: false, message: "El nombre (fileName) y tipo (contentType) del archivo son requeridos" });
    }

    // 2. Limpiamos el nombre y le agregamos un timestamp para que sea 100% único y no sobreescriba otros archivos
    const safeFileName = body.fileName.replace(/\s+/g, '-').toLowerCase();
    const uniqueKey = `uploads/${Date.now()}-${safeFileName}`;

    // 3. Preparamos la instrucción para S3/MinIO
    const command = new PutObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: uniqueKey,
      ContentType: body.contentType,
    });

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
      storageKey: uniqueKey
    });

  } catch (error) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}