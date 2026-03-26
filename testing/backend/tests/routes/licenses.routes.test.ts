import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAllLicensesAction } from '@/routes/licenses.routes';
import * as licensesRepo from '@/repositories/licenses.repository';
import * as jsonUtils from '@/utils/json';

// Mockeamos las dependencias
vi.mock('@/repositories/licenses.repository');
vi.mock('@/utils/json');

describe('Licenses Routes - Cobertura 100%', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getAllLicensesAction debería responder 200 con la lista de licencias al tener éxito', async () => {
    // 1. Preparación: Simulamos datos en el repositorio
    const mockLicenses = [{ id: 1, name: 'MIT' }, { id: 2, name: 'GPL' }];
    vi.mocked(licensesRepo.fetchAllLicensesFromDb).mockResolvedValue(mockLicenses);
    
    const req = {} as any;
    const res = {} as any;

    // 2. Ejecución
    await getAllLicensesAction(req, res);

    // 3. Verificación: Debe llamar a sendJson con 200 y los datos
    expect(licensesRepo.fetchAllLicensesFromDb).toHaveBeenCalled();
    expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 200, {
      ok: true,
      data: mockLicenses
    });
  });

  it('getAllLicensesAction debería responder 500 cuando el repositorio falla', async () => {
    // 1. Preparación: Forzamos un error en el repositorio
    vi.mocked(licensesRepo.fetchAllLicensesFromDb).mockRejectedValue(new Error('DB Error'));
    
    const req = {} as any;
    const res = {} as any;

    // 2. Ejecución
    await getAllLicensesAction(req, res);

    // 3. Verificación: Debe entrar al catch y responder 500
    expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 500, {
      ok: false,
      message: "Error al obtener licencias"
    });
  });
});