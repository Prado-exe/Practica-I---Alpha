import { getTagsForDropdown } from "../services/tags.service";
import type { HttpRequest, HttpResponse } from "../types/http";
import { sendJson } from "../utils/json";
import { getErrorStatus, getErrorMessage } from "./auth.routes";

export async function getAllTagsAction(req: HttpRequest, res: HttpResponse) {
  try {
    const data = await getTagsForDropdown();
    sendJson(res, 200, { ok: true, data });
  } catch (error) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}