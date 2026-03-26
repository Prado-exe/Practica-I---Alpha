import { describe, it, expect } from 'vitest';
import * as tokenUtils from '@/utils/token';

describe('Token Utils', () => {
  it('generateSecureToken debería devolver un hex aleatorio de tamaño correcto', () => {
    const token = tokenUtils.generateSecureToken(16);
    expect(typeof token).toBe('string');
    expect(token.length).toBe(32); // 16 bytes = 32 caracteres hex
  });

  it('hashSecureToken debería devolver un hash sha256', () => {
    const hash1 = tokenUtils.hashSecureToken('mi_token');
    const hash2 = tokenUtils.hashSecureToken('mi_token');
    
    expect(typeof hash1).toBe('string');
    expect(hash1.length).toBe(64); // sha256 siempre da 64 caracteres hex
    expect(hash1).toBe(hash2); // El mismo texto debe dar el mismo hash
  });
});