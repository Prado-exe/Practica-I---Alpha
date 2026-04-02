// backend/vitest.setup.ts
import { vi } from 'vitest';

// Inyectamos variables ficticias en el proceso de Node antes de que cargue el código
process.env.DB_USER = 'test_user';
process.env.DB_PASSWORD = 'test_password';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'test_db';

// También inyectamos las de seguridad por si las necesitas
process.env.JWT_SECRET = 'secret_de_prueba_de_32_caracteres_minimo_123';
process.env.REFRESH_TOKEN_SECRET = 'refresh_de_prueba_de_32_caracteres_minimo_123';
process.env.FRONTEND_ORIGIN = 'http://localhost:5173';
process.env.S3_BUCKET_NAME = 'test-bucket';