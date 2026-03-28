import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Router } from '@/utils/router';

describe('Router - Cobertura 100%', () => {
  let router: Router;

  beforeEach(() => {
    router = new Router();
  });

  it('debería registrar y manejar una ruta estática simple (Líneas 20-30)', async () => {
    const handler = vi.fn().mockResolvedValue(true);
    router.add('GET', '/api/test', [], handler);

    const req = { method: 'GET', url: '/api/test' } as any;
    const res = {} as any;

    const result = await router.handle(req, res);

    expect(result).toBe(true);
    expect(handler).toHaveBeenCalledWith(req, res);
  });

  it('debería manejar rutas con parámetros dinámicos y extraerlos en req.params (Líneas 22-26, 42-49)', async () => {
    const handler = vi.fn();
    router.add('GET', '/api/usuarios/:id/perfil/:slug', [], handler);

    const req = { method: 'GET', url: '/api/usuarios/123/perfil/juan-perez' } as any;
    const res = {} as any;

    await router.handle(req, res);

    // Verificamos la extracción de parámetros múltiples
    expect(req.params).toEqual({
      id: '123',
      slug: 'juan-perez'
    });
    expect(handler).toHaveBeenCalled();
  });

  it('debería ignorar los query strings al buscar la ruta (Línea 33)', async () => {
    const handler = vi.fn();
    router.add('GET', '/api/search', [], handler);

    const req = { method: 'GET', url: '/api/search?q=vitest&page=1' } as any;
    const res = {} as any;

    const result = await router.handle(req, res);

    expect(result).toBe(true);
    expect(handler).toHaveBeenCalled();
  });

  it('debería usar "/" como path por defecto si req.url es nulo o vacío (Línea 33)', async () => {
    const handler = vi.fn();
    router.add('GET', '/', [], handler);

    const req = { method: 'GET', url: undefined } as any; 
    const res = {} as any; 

    const result = await router.handle(req, res);
    
    expect(result).toBe(true);
    expect(handler).toHaveBeenCalled();
  });

  it('debería ejecutar los middlewares y detenerse si uno retorna true (Líneas 53-56)', async () => {
    const middleware1 = vi.fn().mockResolvedValue(true); // Corta la ejecución
    const middleware2 = vi.fn();
    const handler = vi.fn();

    router.add('POST', '/api/data', [middleware1, middleware2], handler);

    const req = { method: 'POST', url: '/api/data' } as any;
    const res = {} as any;

    const result = await router.handle(req, res);

    expect(result).toBe(true);
    expect(middleware1).toHaveBeenCalled();
    expect(middleware2).not.toHaveBeenCalled(); // No debe llegar aquí
    expect(handler).not.toHaveBeenCalled();    // No debe llegar aquí
  });

  it('debería ejecutar todos los middlewares y el handler si los middlewares retornan false (Líneas 53-61)', async () => {
    const middleware = vi.fn().mockResolvedValue(false); // Permite continuar
    const handler = vi.fn();

    router.add('PUT', '/api/update', [middleware], handler);

    const req = { method: 'PUT', url: '/api/update' } as any;
    const res = {} as any;

    const result = await router.handle(req, res);

    expect(result).toBe(true);
    expect(middleware).toHaveBeenCalled();
    expect(handler).toHaveBeenCalled();
  });

  it('debería retornar false si el método no coincide (Línea 36)', async () => {
    router.add('POST', '/api/save', [], vi.fn());

    const req = { method: 'GET', url: '/api/save' } as any;
    const result = await router.handle(req, {} as any);

    expect(result).toBe(false);
  });

  it('debería retornar false si ninguna ruta coincide con la URL (Línea 67)', async () => {
    router.add('GET', '/api/v1', [], vi.fn());

    const req = { method: 'GET', url: '/api/v2' } as any;
    const result = await router.handle(req, {} as any);

    expect(result).toBe(false);
  });
});