import { describe, it, expect } from 'vitest';
import * as otpUtils from './otp';

describe('OTP Utils - Cobertura 100%', () => {
  
  describe('generateOtpCode()', () => {
    it('debería generar un código de 6 dígitos por defecto (Línea 3)', () => {
      const code = otpUtils.generateOtpCode();
      
      expect(code).toHaveLength(6);
      expect(typeof code).toBe('string');
      // Verifica que solo contenga números
      expect(/^[0-9]+$/.test(code)).toBe(true);
    });

    it('debería generar un código con una longitud personalizada (Línea 3)', () => {
      const length = 4;
      const code = otpUtils.generateOtpCode(length);
      
      expect(code).toHaveLength(length);
      expect(/^[0-9]+$/.test(code)).toBe(true);
    });

    it('debería generar códigos diferentes en llamadas consecutivas', () => {
      const code1 = otpUtils.generateOtpCode();
      const code2 = otpUtils.generateOtpCode();
      
      // Existe una posibilidad astronómica de que sean iguales, 
      // pero para un test unitario esto valida la aleatoriedad.
      expect(code1).not.toBe(code2);
    });
  });

  describe('hashOtpCode()', () => {
    it('debería retornar un hash SHA256 en formato hex (Líneas 14-16)', () => {
      const code = '123456';
      const hash = otpUtils.hashOtpCode(code);
      
      // Un hash SHA256 en hex siempre tiene 64 caracteres
      expect(hash).toHaveLength(64);
      expect(/^[a-f0-9]+$/.test(hash)).toBe(true);
    });

    it('debería ser consistente: mismo código debe dar mismo hash', () => {
      const code = '654321';
      const hash1 = otpUtils.hashOtpCode(code);
      const hash2 = otpUtils.hashOtpCode(code);
      
      expect(hash1).toBe(hash2);
    });

    it('debería generar el hash correcto para un valor conocido', () => {
      const code = '123456';
      // Hash precalculado de '123456' usando SHA256
      const expectedHash = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92';
      
      expect(otpUtils.hashOtpCode(code)).toBe(expectedHash);
    });
  });
});