import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as mailer from '@/utils/mailer';
import nodemailer from 'nodemailer';

// Mock de nodemailer
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn().mockReturnValue({
      verify: vi.fn().mockResolvedValue(true),
      sendMail: vi.fn().mockResolvedValue(true)
    })
  }
}));

vi.mock('@/config/env', () => ({
  env: { SMTP_HOST: 'host', SMTP_PORT: 587, SMTP_USER: 'u', SMTP_PASS: 'p', SMTP_FROM: 'test@obs.com' }
}));

describe('Mailer Utils', () => {
  beforeEach(() => vi.clearAllMocks());

  it('warmupMailer debería verificar la conexión y quedar "ready"', async () => {
    await mailer.warmupMailer();
    const health = mailer.getMailerHealth();
    expect(health.ready).toBe(true);
    expect(health.lastError).toBeNull();
  });

  it('sendVerificationEmail debería llamar a sendMail del transporter', async () => {
    // Forzamos que el mailer esté listo
    await mailer.warmupMailer(); 
    
    await expect(mailer.sendVerificationEmail('test@test.com', '123456')).resolves.toBeUndefined();
  });

  it('sendPasswordResetEmail debería llamar a sendMail del transporter con el link', async () => {
    await mailer.warmupMailer();
    
    await expect(mailer.sendPasswordResetEmail('test@test.com', 'http://link.com')).resolves.toBeUndefined();
  });
});