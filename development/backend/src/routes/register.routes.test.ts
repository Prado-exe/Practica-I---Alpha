import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerAction } from './register.routes';
import * as authService from '../services/auth.service';
import * as bodyUtils from '../utils/body';
import * as jsonUtils from '../utils/json';
import { ZodError } from 'zod';
import { registerSchema } from '../validators/auth.validators';

vi.mock('../services/auth.service');
vi.mock('../utils/body');
vi.mock('../utils/json');

describe('Register Routes', () => {
  beforeEach(() => vi.clearAllMocks());

  it('debería responder 201 si el registro es exitoso', async () => {
    vi.mocked(bodyUtils.readJsonBody).mockResolvedValue({ email: 't@t.com', password: 'Password123!', name: 'Test' });
    vi.mocked(authService.registerUser).mockResolvedValue({ message: 'OK', account: {} as any, verification: {} as any });
    
    await registerAction({} as any, {} as any);
    expect(jsonUtils.sendJson).toHaveBeenCalledWith(expect.anything(), 201, expect.anything());
  });

  it('debería responder 400 si la validación Zod falla', async () => {
    // Mandamos un body vacío para forzar error de Zod
    vi.mocked(bodyUtils.readJsonBody).mockResolvedValue({});
    
    await registerAction({} as any, {} as any);
    expect(jsonUtils.sendJson).toHaveBeenCalledWith(expect.anything(), 400, expect.objectContaining({ message: 'Datos inválidos' }));
  });
});