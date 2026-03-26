import { describe, it, expect, vi } from 'vitest';
import * as instService from '@/services/instituciones.service';
import * as instRepo from '@/repositories/instituciones.repository';
import { AppError } from '@/types/app-error';

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";

vi.mock("@aws-sdk/s3-request-presigner");
vi.mock("@aws-sdk/client-s3");
vi.mock("@/config/env", () => ({
  env: { S3_BUCKET_NAME: "test-bucket" }
}));

vi.mock('@/repositories/instituciones.repository');

describe('Instituciones Service - Gestión', () => {
  describe('editInstitution()', () => {
    it('debería validar campos obligatorios antes de llamar al repositorio', async () => {
      await expect(instService.editInstitution(1, { legal_name: '' }, null, 1))
        .rejects.toThrow(new AppError("Faltan campos obligatorios de la institución.", 400));
    });
  });

  describe('removeInstitution()', () => {
    it('debería lanzar AppError 404 si el repositorio devuelve 0 filas eliminadas', async () => {
      vi.mocked(instRepo.deleteInstitutionFromDb).mockResolvedValue(0);
      
      await expect(instService.removeInstitution(999))
        .rejects.toThrow(new AppError("Institución no encontrada", 404));
    });

    it('debería retornar mensaje de éxito si se elimina correctamente', async () => {
      vi.mocked(instRepo.deleteInstitutionFromDb).mockResolvedValue(1);
      const res = await instService.removeInstitution(1);
      expect(res.message).toContain("correctamente");
    });
  });
});

describe('Obtención de Instituciones (S3 y Paginación)', () => {
    it('getInstitutions debería firmar URLs si existe storage_key y manejar errores de S3', async () => {
      const mockInst = [
        { id: 1, storage_key: 'key1' }, // Con logo
        { id: 2, storage_key: null }    // Sin logo
      ];
      vi.mocked(instRepo.fetchInstitutionsFromDb).mockResolvedValue(mockInst);
      vi.mocked(getSignedUrl).mockResolvedValueOnce('http://signed-url.com');

      const res = await instService.getInstitutions();
      
      expect(res[0].logo_url).toBe('http://signed-url.com');
      expect(res[1].logo_url).toBeUndefined();
    });

    it('getPublicInstitutions debería calcular la paginación y manejar fallos de firma silenciosamente', async () => {
      const mockResult = {
        total: 20,
        data: [{ id: 1, storage_key: 'key1' }]
      };
      vi.mocked(instRepo.fetchPublicInstitutionsPaginated).mockResolvedValue(mockResult);
      vi.mocked(getSignedUrl).mockRejectedValue(new Error("S3 Fail")); // Simula catch en L43

      const res = await instService.getPublicInstitutions("busqueda", 2, 9);
      
      expect(res.totalPages).toBe(3); // 20 / 9 = 2.22 -> 3
      expect(res.data[0].logo_url).toBeUndefined(); // Falló la firma pero retornó la inst
    });
  });

  describe('addInstitution()', () => {
    const validData = { 
      legal_name: 'Inst', institution_type: 'Org', 
      country_name: 'Chile', description: 'Desc', data_role: 'User' 
    };
    const validFile = { storage_key: 'k', file_url: 'u' };

    it('debería lanzar error si faltan campos obligatorios', async () => {
      await expect(instService.addInstitution({ legal_name: '' }, validFile, 1))
        .rejects.toThrow("Faltan campos obligatorios");
    });

    it('debería lanzar error si la descripción excede 1000 caracteres', async () => {
      const longDesc = 'a'.repeat(1001);
      await expect(instService.addInstitution({ ...validData, description: longDesc }, validFile, 1))
        .rejects.toThrow("La descripción no puede superar los 1000 caracteres.");
    });

    it('debería lanzar error si no se proporciona el logo', async () => {
      await expect(instService.addInstitution(validData, null, 1))
        .rejects.toThrow("Los datos de la imagen (logo) son obligatorios.");
    });

    it('debería crear la institución si todos los datos son válidos', async () => {
      vi.mocked(instRepo.createInstitutionInDb).mockResolvedValue({ id: 1 } as any);
      const res = await instService.addInstitution(validData, validFile, 1);
      expect(res.id).toBe(1);
    });
  });

  describe('editInstitution() - Casos adicionales', () => {
    it('debería validar longitud de descripción en edición', async () => {
      const longDesc = 'a'.repeat(1001);
      const data = { legal_name: 'n', institution_type: 't', country_name: 'c', description: longDesc, data_role: 'r' };
      await expect(instService.editInstitution(1, data, null, 1))
        .rejects.toThrow("La descripción no puede superar los 1000 caracteres.");
    });

    it('debería actualizar exitosamente llamando al repositorio', async () => {
      const data = { legal_name: 'n', institution_type: 't', country_name: 'c', description: 'ok', data_role: 'r' };
      vi.mocked(instRepo.updateInstitutionInDb).mockResolvedValue({ id: 1, ...data } as any);
      
      const res = await instService.editInstitution(1, data, null, 1);
      expect(res.legal_name).toBe('n');
    });
  });