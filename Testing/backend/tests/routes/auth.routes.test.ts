import { describe, it, expect, vi } from 'vitest';
import { getSessionIdFromRequest, getErrorStatus, getErrorMessage } from '@/routes/auth.routes';
import { AppError } from '@/types/app-error';
import { ZodError } from 'zod';
import * as authUtils from '@/utils/auth';
import * as cookieUtils from '@/utils/request-cookies';
import * as jwtUtils from '@/utils/jwt';

vi.mock('@/utils/auth');
vi.mock('@/utils/request-cookies');
vi.mock('@/utils/jwt');

describe('Auth Routes Helpers', () => {
  it('getSessionIdFromRequest debería retornar desde el access payload', () => {
    vi.mocked(authUtils.tryGetAuthPayload).mockReturnValue({ sessionId: 10 } as any);
    expect(getSessionIdFromRequest({} as any)).toBe(10);
  });

  it('getSessionIdFromRequest debería retornar desde la cookie si no hay access', () => {
    vi.mocked(authUtils.tryGetAuthPayload).mockReturnValue(null);
    vi.mocked(cookieUtils.parseCookies).mockReturnValue({ refreshToken: 'token' });
    vi.mocked(jwtUtils.verifyRefreshToken).mockReturnValue({ sessionId: 20 } as any);
    expect(getSessionIdFromRequest({} as any)).toBe(20);
  });

  it('getErrorStatus debería retornar el statusCode correcto', () => {
    expect(getErrorStatus(new AppError('Test', 404))).toBe(404);
    expect(getErrorStatus(new ZodError([]))).toBe(400);
    expect(getErrorStatus(new Error('Critico'))).toBe(500);
  });

  it('getErrorMessage debería retornar el mensaje correcto', () => {
    expect(getErrorMessage(new AppError('AppError msg', 400))).toBe('AppError msg');
    expect(getErrorMessage(new Error('Fatal'))).toBe('Error interno del servidor');
  });
});