import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as mailer from '@/utils/mailer';

// 👇 TRUCO: Definimos los mocks de las funciones ANTES de importar nodemailer
const mockVerify = vi.hoisted(() => vi.fn());
const mockSendMail = vi.hoisted(() => vi.fn());

// Mock de nodemailer
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn().mockReturnValue({
      verify: mockVerify,
      sendMail: mockSendMail
    })
  }
}));

// Mock de las variables de entorno
vi.mock('@/config/env', () => ({
  env: { SMTP_HOST: 'host', SMTP_PORT: 587, SMTP_USER: 'u', SMTP_PASS: 'p', SMTP_FROM: 'test@obs.com' }
}));

describe('Mailer Utils - Cobertura Total (100%)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Silenciamos los console.log y console.error durante las pruebas
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  // ==========================================
  // 1. warmupMailer y getMailerHealth
  // ==========================================
  describe('warmupMailer() & getMailerHealth()', () => {
    it('debería verificar la conexión exitosamente y quedar "ready"', async () => {
      mockVerify.mockResolvedValueOnce(true);
      
      await mailer.warmupMailer();
      const health = mailer.getMailerHealth();
      
      expect(health.ready).toBe(true);
      expect(health.lastError).toBeNull();
      expect(console.log).toHaveBeenCalledWith('SMTP listo');
    });

    it('debería manejar fallos si el error es una instancia nativa de Error', async () => {
      mockVerify.mockRejectedValueOnce(new Error('Conexión rechazada por el servidor'));
      
      await mailer.warmupMailer();
      const health = mailer.getMailerHealth();
      
      expect(health.ready).toBe(false);
      expect(health.lastError).toBe('Conexión rechazada por el servidor');
      expect(console.error).toHaveBeenCalledWith('SMTP no disponible al iniciar:', 'Conexión rechazada por el servidor');
    });

    it('debería manejar fallos si el error arrojado NO es una instancia de Error (fallback)', async () => {
      mockVerify.mockRejectedValueOnce({ codigo_extraño: 500 }); // Objeto genérico
      
      await mailer.warmupMailer();
      const health = mailer.getMailerHealth();
      
      expect(health.ready).toBe(false);
      expect(health.lastError).toBe('SMTP verification failed');
    });
  });

  // ==========================================
  // 2. ensureMailerReady interno y Envíos (sendMail)
  // ==========================================
  describe('ensureMailerReady() y Funciones de Envío', () => {
    it('debería omitir la reconexión y enviar directamente si el mailer ya estaba listo', async () => {
      // Preparamos el estado "ready" en el módulo
      mockVerify.mockResolvedValueOnce(true);
      await mailer.warmupMailer();
      
      mockVerify.mockClear(); // Limpiamos contadores
      mockSendMail.mockResolvedValueOnce(true);

      // Enviamos el correo
      await mailer.sendVerificationEmail('test@test.com', '123456');
      
      // Validamos que retornó rápido de ensureMailerReady() sin llamar a verify()
      expect(mockVerify).not.toHaveBeenCalled();
      expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
        to: 'test@test.com',
        subject: 'Código de verificación'
      }));
    });

    it('debería forzar una reconexión si no estaba listo y enviar si tiene éxito', async () => {
      // 1. Forzamos estado desconectado inicial
      mockVerify.mockRejectedValueOnce(new Error('Offline inicial'));
      await mailer.warmupMailer();
      expect(mailer.getMailerHealth().ready).toBe(false);

      mockVerify.mockClear();

      // 2. Simulamos que la red "volvió" para el intento de envío
      mockVerify.mockResolvedValueOnce(true);
      mockSendMail.mockResolvedValueOnce(true);

      // 3. Enviamos el correo de recuperación
      await mailer.sendPasswordResetEmail('usuario@correo.com', 'http://link.com');
      
      // Validamos que ejecutó el "warmup" interno (reconexión) y luego envió
      expect(mockVerify).toHaveBeenCalledTimes(1);
      expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
        to: 'usuario@correo.com',
        subject: expect.stringContaining('Recuperación de Contraseña')
      }));
    });

    it('debería abortar el envío y lanzar un error si falla el intento de reconexión', async () => {
      // 1. Forzamos estado desconectado inicial
      mockVerify.mockRejectedValueOnce(new Error('Servicio Caído'));
      await mailer.warmupMailer();

      mockVerify.mockClear();

      // 2. Forzamos que vuelva a fallar cuando intente enviar
      mockVerify.mockRejectedValueOnce(new Error('Servicio Caído Permanente'));

      // 3. Verificamos que frene la ejecución y tire el error hacia la ruta
      await expect(mailer.sendVerificationEmail('test@test.com', '123456'))
        .rejects.toThrow('Servicio Caído Permanente');
        
      expect(mockSendMail).not.toHaveBeenCalled();
    });
  });
});