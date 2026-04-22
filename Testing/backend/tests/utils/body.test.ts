import { describe, it, expect } from 'vitest';
import { readJsonBody } from '@/utils/body';
import { EventEmitter } from 'events';
import { AppError } from '@/types/app-error';

describe('Body Utils', () => {
  it('readJsonBody debería parsear un JSON válido', async () => {
    const req = new EventEmitter() as any;
    const promise = readJsonBody(req);
    req.emit('data', Buffer.from('{"name": "test"}'));
    req.emit('end');
    
    const result = await promise;
    expect(result).toEqual({ name: 'test' });
  });

  it('readJsonBody debería lanzar AppError 400 si el JSON es inválido', async () => {
    const req = new EventEmitter() as any;
    const promise = readJsonBody(req);
    req.emit('data', Buffer.from('{ bad json'));
    req.emit('end');
    
    // 👇 Mensaje ajustado a lo que vimos en la consola
    await expect(promise).rejects.toThrow(new AppError("JSON inválido en el body", 400));
  });

  it('readJsonBody debería lanzar error si la lectura falla', async () => {
    const req = new EventEmitter() as any;
    const promise = readJsonBody(req);
    req.emit('error', new Error('Network error'));
    
    
    await expect(promise).rejects.toThrow('Error al leer el body de la solicitud');
  });
});