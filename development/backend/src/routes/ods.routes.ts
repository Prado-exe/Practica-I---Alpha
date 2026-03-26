import { getOdsForDropdown } from "../services/ods.service";
import type { HttpRequest, HttpResponse } from "../types/http";
import { sendJson } from "../utils/json";
import { getErrorStatus, getErrorMessage } from "./auth.routes";

export async function getAllOdsAction(req: HttpRequest, res: HttpResponse) {
  try {
    const data = await getOdsForDropdown();
    sendJson(res, 200, { ok: true, data });
  } catch (error) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}