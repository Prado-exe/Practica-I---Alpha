import { fetchAllLicensesFromDb } from "../repositories/licenses.repository";
import type { HttpRequest, HttpResponse } from "../types/http";
import { sendJson } from "../utils/json";

export async function getAllLicensesAction(req: HttpRequest, res: HttpResponse) {
  try {
    const data = await fetchAllLicensesFromDb();
    sendJson(res, 200, { ok: true, data });
  } catch (error) {
    sendJson(res, 500, { ok: false, message: "Error al obtener licencias" });
  }
}