"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_s3_1 = require("@aws-sdk/client-s3");
// ¡No leemos el .env, forzamos los valores reales directamente!
const s3Client = new client_s3_1.S3Client({
    region: 'us-east-1',
    endpoint: 'http://localhost:9000',
    credentials: {
        // 👇 PON TU USUARIO REAL AQUÍ ENTRE COMILLAS 👇
        accessKeyId: 'admin_minio',
        // 👇 PON TU CONTRASEÑA REAL AQUÍ ENTRE COMILLAS 👇
        secretAccessKey: 'password123',
    },
    forcePathStyle: true,
});
const BUCKET_NAME = 'observatory-files'; // Cambia esto si tu bucket se llama distinto
async function uploadQA() {
    console.log('🚀 Iniciando subida masiva a MinIO con claves forzadas...');
    let totalFiles = 0;
    for (let i = 1; i <= 50; i++) {
        const numFiles = (i % 4) + 1;
        for (let j = 1; j <= numFiles; j++) {
            const csvContent = `id,dataset,archivo,valor_qa\n1,Dataset-${i},File-${j},${Math.random()}\n2,Dataset-${i},File-${j},${Math.random()}`;
            const buffer = Buffer.from(csvContent, 'utf-8');
            const storageKey = `uploads/qa-dataset-${i}-file-${j}.csv`;
            try {
                await s3Client.send(new client_s3_1.PutObjectCommand({
                    Bucket: BUCKET_NAME,
                    Key: storageKey,
                    Body: buffer,
                    ContentType: 'text/csv'
                }));
                totalFiles++;
                console.log(`   ✅ Subido: ${storageKey}`);
            }
            catch (error) {
                console.error(`   ❌ Falló: ${storageKey} - ${error.message || error.Code}`);
            }
        }
    }
    console.log(`\n🎉 Subida masiva finalizada. Se inyectaron ${totalFiles} archivos.`);
}
uploadQA();
