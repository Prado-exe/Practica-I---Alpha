import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as datasetsService from './datasets.service';
import * as datasetsRepository from '../repositories/datasets.repository';
import { AppError } from '../types/app-error';

// Mockeamos el repositorio
vi.mock('../repositories/datasets.repository');

describe('Datasets Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getDatasets debería retornar datos paginados correctamente', async () => {
    const mockData = { total: 1, data: [{ dataset_id: 1, title: 'Test' }] };
    vi.mocked(datasetsRepository.fetchDatasetsPaginated).mockResolvedValue(mockData);

    const result = await datasetsService.getDatasets(1, false, '', 1, 10);
    
    expect(result.totalPages).toBe(1);
    expect(result.data[0].title).toBe('Test');
    expect(datasetsRepository.fetchDatasetsPaginated).toHaveBeenCalledWith(1, false, '', 10, 0);
  });

  describe('createDataset()', () => {
    it('debería lanzar error si faltan campos obligatorios', async () => {
      // Falta title, category_id, etc.
      await expect(datasetsService.createDataset(1, false, { title: '' }))
        .rejects.toThrow(new AppError("El título del dataset es obligatorio.", 400));
    });

    it('debería llamar a createFullDatasetInDb si los datos son válidos', async () => {
      const input = { 
        title: 'Nuevo Dataset', 
        category_id: 1, 
        description: 'Una descripción válida',
        license_id: 1 
      };

      // 👇 SOLUCIÓN: Usamos el nombre correcto 'createFullDatasetInDb'
      vi.mocked(datasetsRepository.createFullDatasetInDb).mockResolvedValue({ 
        datasetId: 1, 
        title: 'Nuevo Dataset' 
      } as any);

      await datasetsService.createDataset(1, false, input);

      // Verificamos que se llamó a la función correcta con los argumentos correctos
      expect(datasetsRepository.createFullDatasetInDb).toHaveBeenCalledWith(1, false, input);
    });
  });
});