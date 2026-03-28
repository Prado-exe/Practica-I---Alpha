import type { HttpRequest, HttpResponse } from "../types/http";
import { readJsonBody } from "../utils/body";
import { sendJson } from "../utils/json";
import { ZodError } from "zod";
import { registerSchema } from "../validators/auth.validators";
import { registerUser } from "../services/auth.service";
import { getErrorStatus, getErrorMessage } from "./auth.routes";

export async function registerAction(req: HttpRequest, res: HttpResponse) {
  try {
    const body = await readJsonBody<unknown>(req);
    const payload = registerSchema.parse(body);
    const result = await registerUser(payload);

    sendJson(res, 201, {
      ok: true,
      message: result.message,
      account: result.account,
      verification: result.verification,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      sendJson(res, 400, {
        ok: false,
        message: "Datos inválidos",
        errors: error.issues,
      });
      return;
    }

    sendJson(res, getErrorStatus(error), {
      ok: false,
      message: getErrorMessage(error),
    });
  }
}