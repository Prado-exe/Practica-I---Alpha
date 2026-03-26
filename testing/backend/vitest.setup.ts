// backend/vitest.setup.ts
import { vi, beforeAll } from 'vitest';

beforeAll(() => {
  // Inyectamos variables directamente en el proceso por seguridad extra
  process.env.DB_USER = 'test_user';
  process.env.DB_PASS = 'test_pass'; // Cambié PASSWORD por PASS para coincidir con tu config
  process.env.DB_HOST_POSTGRES = 'localhost';
  process.env.DB_PORT = '5432';
  process.env.DB_NAME = 'test_db';

  process.env.JWT_ACCESS_SECRET = 'test_secret_12345678901234567890123456789012';
  process.env.JWT_REFRESH_SECRET = 'test_refresh_12345678901234567890123456789012';
});