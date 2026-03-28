import { fetchAllOdsFromDb } from "../repositories/ods.repository";

export async function getOdsForDropdown() {
  return await fetchAllOdsFromDb();
}