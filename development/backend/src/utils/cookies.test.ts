import { describe, it, expect, vi } from 'vitest';
import { setRefreshTokenCookie, clearRefreshTokenCookie } from './cookies';

vi.mock('../config/env', () => ({
  env: { 
    REFRESH_TOKEN_EXPIRES_IN_MS: 86400000, 
    NODE_ENV: 'production' 
  }
}));

describe('Cookies Utils', () => {
  it('setRefreshTokenCookie debería configurar el Set-Cookie header', () => {
    // 👇 Simulamos el objeto de respuesta completo
    const headers: string[] = [];
    const res = {
      getHeader: vi.fn().mockReturnValue(headers),
      setHeader: vi.fn((name, value) => headers.push(value)),
    } as any;
    
    setRefreshTokenCookie(res, 'mi-token-largo');
    
    expect(res.setHeader).toHaveBeenCalledWith('Set-Cookie', expect.any(Array));
  });

  it('clearRefreshTokenCookie debería poner un token vacío', () => {
    const headers: string[] = [];
    const res = {
      getHeader: vi.fn().mockReturnValue(headers),
      setHeader: vi.fn((name, value) => headers.push(value)),
    } as any;
    
    clearRefreshTokenCookie(res);
    
    expect(res.setHeader).toHaveBeenCalledWith('Set-Cookie', expect.any(Array));
  });
});