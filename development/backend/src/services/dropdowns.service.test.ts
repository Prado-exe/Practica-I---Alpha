import { describe, it, expect, vi } from 'vitest';
import { getCategoriesForDropdown } from './categories.service';
import { getOdsForDropdown } from './ods.service';
import { getTagsForDropdown } from './tags.service';
import * as catRepo from '../repositories/categories.repository';
import * as odsRepo from '../repositories/ods.repository';
import * as tagsRepo from '../repositories/tags.repository';

vi.mock('../repositories/categories.repository');
vi.mock('../repositories/ods.repository');
vi.mock('../repositories/tags.repository');

describe('Dropdown Services', () => {
  it('Deberían retornar listas de sus respectivos repositorios', async () => {
    vi.mocked(catRepo.fetchAllCategoriesFromDb).mockResolvedValue([{ id: 1 }] as any);
    vi.mocked(odsRepo.fetchAllOdsFromDb).mockResolvedValue([{ id: 2 }] as any);
    vi.mocked(tagsRepo.fetchAllTagsFromDb).mockResolvedValue([{ id: 3 }] as any);

    expect(await getCategoriesForDropdown()).toHaveLength(1);
    expect(await getOdsForDropdown()).toHaveLength(1);
    expect(await getTagsForDropdown()).toHaveLength(1);
  });
});