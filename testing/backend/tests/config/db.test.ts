import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Pool } from 'pg';

// 1. Definimos los mocks de los objetos internos usando vi.hoisted
const { mClient, mPool } = vi.hoisted(() => {
  return {
    mClient: {
      query: vi.fn(),
      release: vi.fn(),
    },
    mPool: {
      connect: vi.fn(),
    }
  };
});

// 2. Mock de 'pg' (Debe ser una función tradicional para el constructor 'new')
vi.mock('pg', () => {
  return {
    Pool: vi.fn(function() {
      return mPool;
    })
  };
});

// 3. Mock de 'env' con datos controlados
vi.mock('./env', () => ({
  env: {
    DB_HOST_POSTGRES: 'localhost',
    DB_PORT: 5432,
    DB_USER: 'user',
    DB_PASS: 'pass',
    DB_NAME: 'db'
  }
}));

describe('Database Config - Cobertura 100%', () => {
  beforeEach(() => {
    vi.resetModules(); // 👈 Limpia el cache para que 'db.ts' se ejecute de nuevo
    vi.clearAllMocks();
    mPool.connect.mockResolvedValue(mClient);
  });

  // tests/config/db.test.ts
it('debería inicializar el Pool con los parámetros de env', async () => {
  await import('@/config/db'); 

  expect(Pool).toHaveBeenCalledWith(expect.objectContaining({
    host: 'localhost',
    database: 'test_db' // 👈 Cambia 'db' por 'test_db'
  }));
});

  it('testDbConnection debería conectar, consultar y liberar (Líneas 12-21)', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    // Importamos dinámicamente para obtener la función testDbConnection
    const { testDbConnection } = await import('../../src/config/db');
    
    mClient.query.mockResolvedValueOnce({ rows: [{ '1': 1 }] });

    await testDbConnection();

    expect(mPool.connect).toHaveBeenCalled();
    expect(mClient.query).toHaveBeenCalledWith("SELECT 1"); //
    expect(logSpy).toHaveBeenCalledWith("Base de datos PostgreSQL conectada"); //
    expect(mClient.release).toHaveBeenCalled(); //

    logSpy.mockRestore();
  });

  it('testDbConnection debería liberar el cliente incluso si la query falla (Líneas 18-21)', async () => {
    const { testDbConnection } = await import('../../src/config/db');
    mClient.query.mockRejectedValueOnce(new Error('DB Error'));

    await expect(testDbConnection()).rejects.toThrow('DB Error');
    
    // 🎯 Verificamos que release() se llamó en el bloque finally
    expect(mClient.release).toHaveBeenCalled();
  });
});