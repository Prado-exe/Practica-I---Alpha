import { describe, it, expect } from 'vitest';
import { parseCookies } from './request-cookies';

describe('Request Cookies Utils', () => {
  it('debería retornar un objeto vacío si no hay header cookie', () => {
    const req = { headers: {} } as any;
    expect(parseCookies(req)).toEqual({});
  });

  it('debería parsear múltiples cookies correctamente', () => {
    const req = { headers: { cookie: 'token=abc; refresh=xyz; flag=true' } } as any;
    const cookies = parseCookies(req);
    
    expect(cookies).toEqual({
      token: 'abc',
      refresh: 'xyz',
      flag: 'true'
    });
  });

  it('debería manejar valores URL encoded', () => {
    const req = { headers: { cookie: 'name=Matias%20Perez; empty=' } } as any;
    const cookies = parseCookies(req);
    
    expect(cookies.name).toBe('Matias Perez');
    expect(cookies.empty).toBe('');
  });
});