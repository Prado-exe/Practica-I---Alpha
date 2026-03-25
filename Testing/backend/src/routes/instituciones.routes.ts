import type { HttpRequest, HttpResponse } from "../types/http";
import { sendJson} from "../utils/json";
import { readJsonBody } from "../utils/body";
import { getErrorStatus, getErrorMessage } from "./auth.routes"; 
import { getInstitutions, addInstitution, editInstitution, removeInstitution } from "../services/instituciones.service";

// Para obtener el account_id de la persona que está creando la institución
import { tryGetAuthPayload } from "../utils/auth"; 

export async function getInstitucionesAction(req: HttpRequest, res: HttpResponse) {
  try {
    const instituciones = await getInstitutions();
    sendJson(res, 200, { ok: true, instituciones });
  } catch (error) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}

export async function createInstitucionAction(req: HttpRequest, res: HttpResponse) {
  try {
    // Obtenemos quién está haciendo la petición
    const payload = tryGetAuthPayload(req);
    const accountId = Number(payload?.sub);

    const body = await readJsonBody<{ institution: any, file: any }>(req);
    
    const inst = await addInstitution(body.institution, body.file, accountId);
    sendJson(res, 201, { ok: true, message: "Institución creada", institucion: inst });
  } catch (error) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}

export async function updateInstitucionAction(req: HttpRequest, res: HttpResponse) {
  try {
    const id = Number((req as any).params?.id);
    if (!id || isNaN(id)) return sendJson(res, 400, { ok: false, message: "ID inválido" });

    // Obtenemos quién está haciendo la petición
    const payload = tryGetAuthPayload(req);
    const accountId = Number(payload?.sub);

    // En edición, 'file' puede venir como null si el admin no seleccionó una nueva imagen
    const body = await readJsonBody<{ institution: any, file: any }>(req);
    
    const inst = await editInstitution(id, body.institution, body.file, accountId);
    sendJson(res, 200, { ok: true, message: "Institución actualizada correctamente", institucion: inst });
  } catch (error) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}

export async function deleteInstitucionAction(req: HttpRequest, res: HttpResponse) {
  try {
    const id = Number((req as any).params?.id);
    if (!id || isNaN(id)) return sendJson(res, 400, { ok: false, message: "ID inválido" });

    const result = await removeInstitution(id);
    sendJson(res, 200, { ok: true, message: result.message });
  } catch (error) {
    sendJson(res, getErrorStatus(error), { ok: false, message: getErrorMessage(error) });
  }
}