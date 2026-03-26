import { S3Client } from "@aws-sdk/client-s3";
import { env } from "./env"; // Tu archivo de variables de entorno

export const s3Client = new S3Client({
  endpoint: env.S3_ENDPOINT, // ESTA es la magia que lo redirige a tu MinIO local
  region: env.S3_REGION,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_KEY,
  },
  // ¡CRÍTICO PARA MINIO! AWS usa "bucket.url.com", MinIO usa "url.com/bucket"
  forcePathStyle: true, 
});