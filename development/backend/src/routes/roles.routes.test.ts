import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getRolesDetailsAction, getPermisosAction, createRoleAction, updateRoleAction, deleteRoleAction } from './roles.routes';
import * as rolesService from '../services/roles.service';
import * as jsonUtils from '../utils/json';
import * as bodyUtils from '../utils/body';

vi.mock('../services/roles.service');
vi.mock('../utils/json');
vi.mock('../utils/body');

describe('Roles Routes', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getRolesDetailsAction debería responder 200', async () => {
    vi.mocked(rolesService.getRolesDetails).mockResolvedValue([]);
    await getRolesDetailsAction({} as any, {} as any);
    expect(jsonUtils.sendJson).toHaveBeenCalledWith(expect.anything(), 200, expect.anything());
  });

  it('createRoleAction debería responder 201', async () => {
    vi.mocked(bodyUtils.readJsonBody).mockResolvedValue({ code: 'c', name: 'n', description: 'd', permisos: [] });
    vi.mocked(rolesService.createNewRole).mockResolvedValue({ message: 'OK', roleId: 1 });
    await createRoleAction({} as any, {} as any);
    expect(jsonUtils.sendJson).toHaveBeenCalledWith(expect.anything(), 201, expect.anything());
  });

  it('updateRoleAction debería capturar errores y responder código de error', async () => {
    vi.mocked(bodyUtils.readJsonBody).mockResolvedValue({} as any);
    vi.mocked(rolesService.updateExistingRole).mockRejectedValue(new Error('Fatal'));
    await updateRoleAction({ params: { id: '1' } } as any, {} as any);
    expect(jsonUtils.sendJson).toHaveBeenCalledWith(expect.anything(), 500, expect.objectContaining({ ok: false }));
  });

  it('deleteRoleAction debería responder 400 si no hay ID', async () => {
    await deleteRoleAction({ params: {} } as any, {} as any);
    expect(jsonUtils.sendJson).toHaveBeenCalledWith(expect.anything(), 400, expect.anything());
  });
});