import { describe, it, expect, vi } from 'vitest';
import * as passwordUtils from './password';
import bcrypt from 'bcrypt';

vi.mock('bcrypt');

describe('Password Utils', () => {
  it('hashPassword debería devolver una contraseña encriptada', async () => {
    vi.mocked(bcrypt.hash).mockResolvedValue('hash_seguro' as any);
    const result = await passwordUtils.hashPassword('123456');
    expect(result).toBe('hash_seguro');
  });

  it('comparePassword debería devolver true si coinciden', async () => {
    vi.mocked(bcrypt.compare).mockResolvedValue(true as any);
    const match = await passwordUtils.comparePassword('123456', 'hash_seguro');
    expect(match).toBe(true);
  });
});