import { describe, it, expect, vi } from 'vitest';
import * as jwtUtils from './jwt';
import jwt from 'jsonwebtoken';
import { AppError } from '../types/app-error';

// Mockeamos la LIBRERÍA externa, no nuestro archivo
vi.mock('jsonwebtoken');
vi.mock('../config/env', () => ({
  env: { 
    JWT_ACCESS_SECRET: 'access_secret', 
    JWT_REFRESH_SECRET: 'refresh_secret', 
    ACCESS_TOKEN_EXPIRES_IN_MS: 900000, 
    REFRESH_TOKEN_EXPIRES_IN_MS: 604800000 
  }
}));

describe('JWT Utils', () => {
  it('signAccessToken y signRefreshToken deberían retornar un string firmado', () => {
    vi.mocked(jwt.sign).mockReturnValue('token_firmado' as any);
    
    const access = jwtUtils.signAccessToken({ sub: 1, email: 't@t.com', permissions: [], role: 'registered_user', sessionId: 1 });
    const refresh = jwtUtils.signRefreshToken({ sub: 1, email: 't@t.com', sessionId: 1, tokenId: 'abc' });
    
    expect(access).toBe('token_firmado');
    expect(refresh).toBe('token_firmado');
  });

  it('verifyAccessToken debería retornar el payload validado', () => {
    vi.mocked(jwt.verify).mockReturnValue({ sub: '1', sessionId: '10', email: 't@t.com', permissions: ['read'] } as any);
    
    const res = jwtUtils.verifyAccessToken('token_valido');
    expect(res.sub).toBe(1);
    expect(res.sessionId).toBe(10);
    expect(res.permissions).toContain('read');
  });

  it('verifyAccessToken debería lanzar AppError si faltan datos obligatorios', () => {
    // Simulamos un payload corrupto (sin email)
    vi.mocked(jwt.verify).mockReturnValue({ sub: '1', sessionId: '10' } as any);
    
    expect(() => jwtUtils.verifyAccessToken('token_corrupto')).toThrow(new AppError("Payload de access token inválido", 401));
  });

  it('verifyRefreshToken debería retornar el payload validado', () => {
    vi.mocked(jwt.verify).mockReturnValue({ sub: '1', sessionId: '10', email: 't@t.com', tokenId: 'abc' } as any);
    
    const res = jwtUtils.verifyRefreshToken('token_valido');
    expect(res.tokenId).toBe('abc');
  });

  it('verifyRefreshToken debería lanzar AppError si falla la librería JWT', () => {
    vi.mocked(jwt.verify).mockImplementation(() => { throw new Error('Expirado') });
    
    expect(() => jwtUtils.verifyRefreshToken('token_expirado')).toThrow(new AppError("Refresh token inválido o expirado", 401));
  });
});