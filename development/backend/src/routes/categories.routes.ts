import { getCategoriesForDropdown } from "../services/categories.service";
import { HttpRequest, HttpResponse} from "../types/http"; 
import { sendJson} from "../utils/json";
import { getErrorStatus, getErrorMessage } from "./auth.routes";

export async function getAllCategoriesAction(req: HttpRequest, res: HttpResponse) {
  try {
    const data = await getCategoriesForDropdown();
    sendJson(res, 200, { ok: true, data });
  } catch (error) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}