import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import http from 'http';
import { testDbConnection } from '@/config/db';
import { warmupMailer } from '@/utils/mailer';
import { applySecurityHeaders } from '@/utils/security-headers';
import { sendJson } from '@/utils/json';
import { authRouter } from '@/routes/auth.routes';
import { env } from '@/config/env';

// ==========================================
// 1. CONFIGURACIÓN DE MOCKS GLOBALES
// ==========================================

// Interceptamos process.exit para que Vitest no muera si falla el bootstrap
const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

// Variables para capturar el servidor y su manejador de peticiones (req, res)
let requestHandler: any;
let mockListen: any;

vi.mock('http', () => {
  mockListen = vi.fn((port, callback) => {
    if (callback) callback(); // Simulamos que el servidor empezó a escuchar
  });
  return {
    default: {
      createServer: vi.fn((handler) => {
        requestHandler = handler; // Guardamos el handler para inyectarle peticiones falsas
        return { listen: mockListen };
      })
    }
  };
});

vi.mock('@/config/env', () => ({
  env: { PORT: 3000, FRONTEND_ORIGIN: 'http://localhost:5173' }
}));

vi.mock('@/config/db', () => ({
  testDbConnection: vi.fn()
}));

vi.mock('@/utils/mailer', () => ({
  warmupMailer: vi.fn()
}));

vi.mock('@/utils/security-headers', () => ({
  applySecurityHeaders: vi.fn()
}));

vi.mock('@/utils/json', () => ({
  sendJson: vi.fn()
}));

vi.mock('@/routes/auth.routes', () => ({
  authRouter: { handle: vi.fn() }
}));

vi.mock('@/swagger', () => ({
  swaggerSpec: {}
}));

const { mockSystemHandle, mockSetupSwagger } = vi.hoisted(() => ({
  mockSystemHandle: vi.fn(),
  mockSetupSwagger: vi.fn()
}));

vi.mock('@/utils/router', () => ({
  Router: vi.fn().mockImplementation(function() {
    return {
      setupSwagger: mockSetupSwagger,
      handle: mockSystemHandle
    };
  })
}));

// ==========================================
// 2. SUITE DE PRUEBAS
// ==========================================
describe('Server Entry Point (server.ts) - Cobertura 100%', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Limpiamos el caché de los módulos para que el server se re-ejecute limpio en cada test
    vi.resetModules();
  });

  describe('Fase de Arranque (Bootstrap)', () => {
    it('debería inicializar DB, Servidor y Mailer correctamente', async () => {
      // Configuramos el caso de éxito
      vi.mocked(testDbConnection).mockResolvedValueOnce(undefined);
      
      // Importamos dinámicamente el servidor para disparar el bootstrap
      await import('@/server');

      // Verificamos el orden lógico
      expect(testDbConnection).toHaveBeenCalled();
      expect(mockListen).toHaveBeenCalledWith(3000, expect.any(Function));
      expect(warmupMailer).toHaveBeenCalled();
      expect(mockConsoleLog).toHaveBeenCalledWith('Server listening on port 3000');
    });

    it('debería detener el proceso si la base de datos falla al conectar', async () => {
      // Simulamos una caída catastrófica de la BD
      const dbError = new Error('DB Connection Refused');
      vi.mocked(testDbConnection).mockRejectedValueOnce(dbError);

      await import('@/server');
      
      // Esperamos a que el ciclo de eventos resuelva las promesas
      await new Promise(process.nextTick); 

      expect(mockConsoleError).toHaveBeenCalledWith('Error al iniciar el servidor:', dbError);
      expect(mockExit).toHaveBeenCalledWith(1); // El proceso debe morir con código 1
    });
  });

  describe('Manejador de Peticiones HTTP', () => {
    let mockReq: any;
    let mockRes: any;

    beforeEach(async () => {
      // Preparamos objetos falsos de Request y Response antes de cada petición
      mockReq = { method: 'GET', url: '/api/test' };
      mockRes = {
        setHeader: vi.fn(),
        writeHead: vi.fn(),
        end: vi.fn(),
        headersSent: false
      };
      
      // Nos aseguramos de tener el handler cargado
      await import('@/server');
    });

    it('debería inyectar cabeceras CORS y de seguridad a todas las peticiones', async () => {
      await requestHandler(mockReq, mockRes);
      
      expect(applySecurityHeaders).toHaveBeenCalledWith(mockRes); //
      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'http://localhost:5173');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    });

    it('debería inyectar CSP específico si la ruta es /api-docs', async () => {
      mockReq.url = '/api-docs/swagger-ui.css';
      await requestHandler(mockReq, mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Security-Policy',
        expect.stringContaining("img-src 'self' data: https://validator.swagger.io;") //
      );
    });

    it('debería responder inmediatamente con 204 ante peticiones preflight OPTIONS', async () => {
      mockReq.method = 'OPTIONS';
      await requestHandler(mockReq, mockRes);

      expect(mockRes.writeHead).toHaveBeenCalledWith(204); //
      expect(mockRes.end).toHaveBeenCalled();
      // No debe avanzar hacia los routers
      expect(mockSystemHandle).not.toHaveBeenCalled(); 
    });

    it('debería delegar el manejo a systemRouter si coincide la ruta', async () => {
      mockSystemHandle.mockResolvedValueOnce(true); // Simulamos que Swagger lo manejó
      await requestHandler(mockReq, mockRes);

      expect(mockSystemHandle).toHaveBeenCalledWith(mockReq, mockRes); //
      expect(authRouter.handle).not.toHaveBeenCalled(); // No debe pasar al authRouter
    });

    it('debería delegar el manejo a authRouter si systemRouter lo ignora', async () => {
      mockSystemHandle.mockResolvedValueOnce(false); 
      vi.mocked(authRouter.handle).mockResolvedValueOnce(true); // Lo maneja la lógica de negocio

      await requestHandler(mockReq, mockRes);

      expect(authRouter.handle).toHaveBeenCalledWith(mockReq, mockRes); //
      expect(sendJson).not.toHaveBeenCalled(); // No debe mandar 404
    });

    it('debería responder con 404 si ningún enrutador manejó la petición', async () => {
      mockSystemHandle.mockResolvedValueOnce(false);
      vi.mocked(authRouter.handle).mockResolvedValueOnce(false);

      await requestHandler(mockReq, mockRes);

      expect(sendJson).toHaveBeenCalledWith(mockRes, 404, { ok: false, message: 'Ruta no encontrada' }); //
    });

    it('debería aplicar el Master Try/Catch y devolver 500 ante una excepción no controlada', async () => {
      const criticalError = new Error('Fallo catastrófico de memoria');
      mockSystemHandle.mockRejectedValueOnce(criticalError); // Hacemos explotar al router

      await requestHandler(mockReq, mockRes);

      expect(mockConsoleError).toHaveBeenCalledWith('🔥 Error CRÍTICO no capturado en el servidor:', criticalError); //
      expect(sendJson).toHaveBeenCalledWith(mockRes, 500, { ok: false, message: 'Error interno del servidor' }); //
    });
  });
});