import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],  // ← faltaba esto

    env: {
      DB_USER: 'test_user',
      DB_PASS: 'test_pass',
      DB_HOST_POSTGRES: 'localhost',
      DB_PORT: '5432',
      DB_NAME: 'test_db',
      SMTP_HOST: 'smtp.test.com',
      SMTP_USER: 'test',
      SMTP_PASS: 'test',
      SMTP_FROM: 'test@test.com',
      JWT_ACCESS_SECRET: 'test_secret_12345678901234567890123456789012',
      JWT_REFRESH_SECRET: 'test_refresh_12345678901234567890123456789012',
      FRONTEND_ORIGIN: 'http://localhost:5173/',
      S3_BUCKET_NAME: 'test-bucket',
      S3_ACCESS_KEY: 'test_key',
      S3_SECRET_KEY: 'test_secret'
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),  // ← faltaba esto
    },
  },
});