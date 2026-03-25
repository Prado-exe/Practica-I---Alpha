import type { HttpRequest, HttpResponse } from "../types/http";
import { readJsonBody } from "../utils/body";
import { sendJson } from "../utils/json";
import { ZodError } from "zod";
import { verifyCodeSchema, resendVerificationSchema } from "../validators/auth.validators";
import { verifyEmailCode, resendVerificationCode } from "../services/auth.service";
import { getErrorStatus, getErrorMessage } from "./auth.routes";

export async function verifyEmailAction(req: HttpRequest, res: HttpResponse) {
  try {
    const body = await readJsonBody<unknown>(req);
    const payload = verifyCodeSchema.parse(body);
    const result = await verifyEmailCode(payload);

    sendJson(res, 200, result);
  } catch (error) {
    if (error instanceof ZodError) {
      sendJson(res, 400, {
        valid: false,
        message: "Datos inválidos",
        errors: error.issues,
      });
      return;
    }

    sendJson(res, getErrorStatus(error), {
      valid: false,
      message: getErrorMessage(error),
    });
  }
}

export async function resendVerificationAction(req: HttpRequest, res: HttpResponse) {
  try {
    const body = await readJsonBody<unknown>(req);
    const payload = resendVerificationSchema.parse(body);

    const result = await resendVerificationCode(payload.email);

    sendJson(res, 200, {
      ok: true,
      message: result.message,
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