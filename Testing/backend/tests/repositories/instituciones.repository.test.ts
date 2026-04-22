import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pool } from '@/config/db';
import * as instRepo from '@/repositories/instituciones.repository';

// Simulamos la base de datos
vi.mock('@/config/db', () => ({
  pool: { query: vi.fn(), connect: vi.fn() },
}));

describe('Instituciones Repository - Cobertura 100%', () => {
  let mockClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = { query: vi.fn(), release: vi.fn() };
    vi.mocked(pool.connect).mockResolvedValue(mockClient);
  });

  // ==========================================
  // 1. fetchInstitutionsFromDb
  // ==========================================
  describe('fetchInstitutionsFromDb()', () => {
    it('debería traer todas las instituciones', async () => {
      const mockRows = [{ institution_id: 1, legal_name: 'Inst 1' }];
      vi.mocked(pool.query).mockResolvedValueOnce({ rows: mockRows } as any);
      
      const result = await instRepo.fetchInstitutionsFromDb();
      
      expect(result).toEqual(mockRows);
      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('SELECT i.*'));
    });
  });

  // ==========================================
  // 2. createInstitutionInDb
  // ==========================================
  describe('createInstitutionInDb()', () => {
    it('debería crear institución con un formato de archivo existente y acceso público', async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // 1. BEGIN
        .mockResolvedValueOnce({ rows: [{ file_format_id: 5 }] }) // 2. SELECT file_formats
        .mockResolvedValueOnce({ rows: [{ aws_file_reference_id: 10 }] }) // 3. INSERT aws_file_references
        .mockResolvedValueOnce({ rows: [{ institution_id: 100 }] }) // 4. INSERT institutions
        .mockResolvedValueOnce({}); // 5. COMMIT

      const res = await instRepo.createInstitutionInDb({ access_level: 'public' }, { mime_type: 'image/png', file_url: 'url_logo' }, 1);
      
      expect(res.institution_id).toBe(100);
      expect(res.logo_url).toBe('url_logo'); // Se añade dinámicamente al final
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('debería usar formato fallback (1) y acceso internal si los datos varían', async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // 1. BEGIN
        .mockResolvedValueOnce({ rows: [] }) // 2. SELECT file_formats (vacío simula que no existe el mime_type)
        .mockResolvedValueOnce({ rows: [{ aws_file_reference_id: 11 }] }) // 3. INSERT aws_file_references
        .mockResolvedValueOnce({ rows: [{ institution_id: 101 }] }) // 4. INSERT institutions
        .mockResolvedValueOnce({}); // 5. COMMIT

      await instRepo.createInstitutionInDb({ access_level: 'internal' }, { mime_type: 'formato/raro' }, 1);
      
      const fileInsertCall = mockClient.query.mock.calls[2];
      const paramsFile = fileInsertCall[1];
      
      // paramsFile[2] es el file_format_id ($3 en la query), debería ser el fallback 1
      expect(paramsFile[2]).toBe(1); 
      // paramsFile[6] es el file_scope ($7 en la query), debería ser 'internal'
      expect(paramsFile[6]).toBe('internal');
    });

    it('debería hacer ROLLBACK si ocurre un error en la BD', async () => {
      mockClient.query.mockRejectedValueOnce(new Error('Crash BD'));
      
      await expect(instRepo.createInstitutionInDb({}, {}, 1)).rejects.toThrow('Crash BD');
      
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  // ==========================================
  // 3. updateInstitutionInDb
  // ==========================================
  describe('updateInstitutionInDb()', () => {
    it('debería actualizar la institución SIN un nuevo logo', async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // 1. BEGIN
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ institution_id: 1 }] }) // 2. UPDATE institutions
        .mockResolvedValueOnce({}); // 3. COMMIT

      const res = await instRepo.updateInstitutionInDb(1, { access_level: 'internal' }, null, 1);
      
      expect(res.institution_id).toBe(1);
      // Validamos que se usó la consulta corta (sin newLogoFileId)
      expect(mockClient.query.mock.calls[1][0]).not.toContain('logo_file_id =');
    });

    it('debería actualizar CON un nuevo logo usando fallback de formato', async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // 1. BEGIN
        .mockResolvedValueOnce({ rows: [] }) // 2. SELECT file_formats (vacío)
        .mockResolvedValueOnce({ rows: [{ aws_file_reference_id: 99 }] }) // 3. INSERT aws_file_references
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ institution_id: 2 }] }) // 4. UPDATE institutions
        .mockResolvedValueOnce({}); // 5. COMMIT

      const res = await instRepo.updateInstitutionInDb(2, { access_level: 'public' }, { mime_type: 'image/webp' }, 1);
      
      expect(res.institution_id).toBe(2);
      // Validamos que se usó la consulta larga (con newLogoFileId = 99)
      expect(mockClient.query.mock.calls[3][0]).toContain('logo_file_id = $9');
    });

    it('debería lanzar error y hacer ROLLBACK si la institución a editar no existe', async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // 1. BEGIN
        .mockResolvedValueOnce({ rowCount: 0, rows: [] }); // 2. UPDATE institutions falla

      await expect(instRepo.updateInstitutionInDb(99, {}, null, 1)).rejects.toThrow('Institución no encontrada');
      
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('debería hacer ROLLBACK ante un error general de la BD', async () => {
      mockClient.query.mockRejectedValueOnce(new Error('Fallo crítico'));
      
      await expect(instRepo.updateInstitutionInDb(1, {}, null, 1)).rejects.toThrow('Fallo crítico');
      
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  // ==========================================
  // 4. deleteInstitutionFromDb
  // ==========================================
  describe('deleteInstitutionFromDb()', () => {
    it('debería retornar el número de filas borradas (ej. 1)', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({ rowCount: 1 } as any);
      
      const res = await instRepo.deleteInstitutionFromDb(5);
      expect(res).toBe(1);
    });

    it('debería manejar el caso en que rowCount es undefined (retornando 0)', async () => {
      // Mockeamos la respuesta sin rowCount para forzar el fallback `?? 0`
      vi.mocked(pool.query).mockResolvedValueOnce({} as any);
      
      const res = await instRepo.deleteInstitutionFromDb(99);
      expect(res).toBe(0);
    });
  });

  // ==========================================
  // 5. fetchPublicInstitutionsPaginated
  // ==========================================
  describe('fetchPublicInstitutionsPaginated()', () => {
    it('debería armar la cláusula ILIKE si hay término de búsqueda', async () => {
      vi.mocked(pool.query)
        .mockResolvedValueOnce({ rows: [{ count: '10' }] } as any) // COUNT query
        .mockResolvedValueOnce({ rows: [{ institution_id: 1 }] } as any); // SELECT query
      
      const res = await instRepo.fetchPublicInstitutionsPaginated('salud', 5, 0);
      
      expect(res.total).toBe(10);
      // Validamos que el COUNT incluyó el ILIKE
      expect(vi.mocked(pool.query).mock.calls[0][0]).toContain('ILIKE $1');
      // Validamos los parámetros pasados (search + limit + offset)
      expect(vi.mocked(pool.query).mock.calls[1][1]).toEqual(['%salud%', 5, 0]);
    });

    it('debería omitir el ILIKE si no hay término de búsqueda', async () => {
      vi.mocked(pool.query)
        .mockResolvedValueOnce({ rows: [{ count: '25' }] } as any)
        .mockResolvedValueOnce({ rows: [{ institution_id: 2 }] } as any);
      
      const res = await instRepo.fetchPublicInstitutionsPaginated('', 10, 10);
      
      expect(res.total).toBe(25);
      // Validamos que el COUNT no incluyó el ILIKE
      expect(vi.mocked(pool.query).mock.calls[0][0]).not.toContain('ILIKE');
      // Validamos que solo se enviaron limit y offset
      expect(vi.mocked(pool.query).mock.calls[1][1]).toEqual([10, 10]);
    });
  });
});