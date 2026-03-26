import { fetchAllTagsFromDb } from "../repositories/tags.repository";

export async function getTagsForDropdown() {
  return await fetchAllTagsFromDb();
}