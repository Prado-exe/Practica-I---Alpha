import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateUploadUrlAction } from '@/routes/upload.routes';
import * as jsonUtils from '@/utils/json';
import * as bodyUtils from '@/utils/body';
import * as authRoutes from '@/routes/auth.routes';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// ==========================================
// 1. CONFIGURACIÓN DE MOCKS
// ==========================================
vi.mock('@/utils/json');
vi.mock('@/utils/body');
vi.mock('@/routes/auth.routes');

vi.mock('@/config/env', () => ({
  env: {
    S3_BUCKET_NAME: 'test-bucket',
    S3_ENDPOINT: 'http://localhost:9000'
  }
}));

// Mock del cliente S3
vi.mock('@/config/s3', () => ({
  s3Client: { send: vi.fn() }
}));

// SOLUCIÓN AL ERROR: Mock de la clase PutObjectCommand compatible con 'new'
vi.mock('@aws-sdk/client-s3', () => {
  return {
    PutObjectCommand: vi.fn().mockImplementation(function(this: any, args: any) {
      this.args = args;
    })
  };
});

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn()
}));

describe('Upload Routes - Cobertura 100%', () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Inicializamos req y res correctamente
    req = {};
    res = { headersSent: false }; 

    // Mocks de error por defecto (se usarán si el test falla y entra al catch)
    vi.mocked(authRoutes.getErrorStatus).mockReturnValue(500);
    vi.mocked(authRoutes.getErrorMessage).mockReturnValue('Error desconocido');

    // Congelamos el tiempo para que la storageKey sea idéntica
    vi.spyOn(Date, 'now').mockReturnValue(123456789);
  });

  it('debería generar una URL prefirmada correctamente al recibir parámetros válidos', async () => {
    const mockBody = { fileName: 'Censo 2026.csv', contentType: 'text/csv' };
    
    // 1. Simulamos la lectura exitosa del body
    vi.mocked(bodyUtils.readJsonBody).mockResolvedValue(mockBody);
    
    // 2. Simulamos la respuesta exitosa del firmador de S3
    vi.mocked(getSignedUrl).mockResolvedValue('http://presigned-url.com/upload');

    // 3. Ejecutamos la acción
    await generateUploadUrlAction(req, res);

    // 4. Verificamos que la URL y la Key se generen según la lógica de sanitización
    const expectedKey = 'uploads/123456789-censo-2026.csv';
    
    expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 200, {
      ok: true,
      uploadUrl: 'http://presigned-url.com/upload',
      fileUrl: `http://localhost:9000/test-bucket/${expectedKey}`,
      storageKey: expectedKey
    });
  });

  it('debería devolver 400 si falta el fileName o contentType', async () => {
    // Simulamos un body incompleto
    vi.mocked(bodyUtils.readJsonBody).mockResolvedValue({ fileName: 'solo-nombre.txt' } as any);

    await generateUploadUrlAction(req, res);

    expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 400, expect.objectContaining({
      ok: false,
      message: expect.stringContaining("requeridos")
    }));
  });

  it('debería manejar errores de S3 y activar el bloque catch', async () => {
    vi.mocked(bodyUtils.readJsonBody).mockResolvedValue({ fileName: 'a.csv', contentType: 'text/csv' });
    
    // Forzamos un error en la firma
    vi.mocked(getSignedUrl).mockRejectedValue(new Error('S3 Connection Error'));

    await generateUploadUrlAction(req, res);

    // Verificamos que responda con el status del catch (500)
    expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 500, {
      ok: false,
      message: 'Error desconocido'
    });
  });
});