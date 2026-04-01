import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

import * as dotenv from 'dotenv';
dotenv.config();

const s3Client = new S3Client({
  region: process.env.S3_REGION,
  endpoint: process.env.S3_ENDPOINT || undefined, 
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '', 
    secretAccessKey: process.env.S3_SECRET_KEY || '', 
  },
  forcePathStyle: true,
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME;

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
        await s3Client.send(new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: storageKey,
          Body: buffer,
          ContentType: 'text/csv'
        }));
        totalFiles++;
        console.log(`   ✅ Subido: ${storageKey}`);
      } catch (error: any) {
        console.error(`   ❌ Falló: ${storageKey} - ${error.message || error.Code}`);
      }
    }
  }
  
  console.log(`\n🎉 Subida masiva finalizada. Se inyectaron ${totalFiles} archivos.`);
}

uploadQA();