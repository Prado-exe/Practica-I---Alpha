import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAllCategoriesAction } from './categories.routes';
import * as catService from '../services/categories.service';
import * as jsonUtils from '../utils/json';
import * as authRoutes from './auth.routes';

// Mockeamos todas las dependencias externas
vi.mock('../services/categories.service');
vi.mock('../utils/json');
vi.mock('./auth.routes');

describe('Categories Routes', () => {
  // Limpiamos los mocks antes de cada test para evitar interferencias
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getAllCategoriesAction debería responder 200 con las categorías cuando tiene éxito', async () => {
    // 1. Preparación (Arrange)
    const mockData = [{ id: 1, name: 'Categoría Test' }];
    vi.mocked(catService.getCategoriesForDropdown).mockResolvedValue(mockData);
    
    const req = {} as any;
    const res = {} as any;

    // 2. Ejecución (Act)
    await getAllCategoriesAction(req, res);

    // 3. Verificación (Assert)
    expect(catService.getCategoriesForDropdown).toHaveBeenCalled();
    expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 200, {
      ok: true,
      data: mockData
    });
  });

  it('getAllCategoriesAction debería responder con el status de error cuando el servicio falla', async () => {
    // 1. Preparación (Arrange)
    const mockError = new Error('Fallo de base de datos');
    vi.mocked(catService.getCategoriesForDropdown).mockRejectedValue(mockError);
    
    // Mockeamos las funciones de ayuda de auth.routes que usa tu controlador
    vi.mocked(authRoutes.getErrorStatus).mockReturnValue(500);
    vi.mocked(authRoutes.getErrorMessage).mockReturnValue('Error interno');

    const req = {} as any;
    const res = {} as any;

    // 2. Ejecución (Act)
    await getAllCategoriesAction(req, res);

    // 3. Verificación (Assert)
    expect(authRoutes.getErrorStatus).toHaveBeenCalledWith(mockError);
    expect(authRoutes.getErrorMessage).toHaveBeenCalledWith(mockError);
    expect(jsonUtils.sendJson).toHaveBeenCalledWith(res, 500, {
      ok: false,
      message: 'Error interno'
    });
  });
});