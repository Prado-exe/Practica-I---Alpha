// backend/src/tests/setup.ts
import { beforeAll, afterAll } from 'vitest';
import { pool } from '../config/db';

beforeAll(async () => {
  // 🛡️ Forzamos las variables de entorno para usar la BD de QA de Docker
  process.env.DB_HOST_POSTGRES = 'localhost'; // o 'postgres' si corre dentro de docker
  process.env.DB_NAME = 'appdb_test';
  
  // Aquí el QA podrá agregar lógica para limpiar tablas antes de empezar
});

afterAll(async () => {
  // Cerramos el pool de conexiones para que el test no se quede colgado
  await pool.end();
});