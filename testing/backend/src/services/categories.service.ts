import { fetchAllCategoriesFromDb } from "../repositories/categories.repository";

export async function getCategoriesForDropdown() {
  return await fetchAllCategoriesFromDb();
}