import type { HttpRequest } from "../types/http";
import { AppError } from "../types/app-error";

const MAX_JSON_BODY_SIZE_BYTES = 1024 * 1024; // 1 MB

export async function readJsonBody<T>(req: HttpRequest): Promise<T> {
  return new Promise((resolve, reject) => {
    let body = "";
    let totalBytes = 0;
    let aborted = false;

    req.on("data", (chunk: Buffer) => {
      if (aborted) {
        return;
      }

      totalBytes += chunk.length;

      if (totalBytes > MAX_JSON_BODY_SIZE_BYTES) {
        aborted = true;
        reject(new AppError("Body demasiado grande", 413));
        req.destroy();
        return;
      }

      body += chunk.toString("utf8");
    });

    req.on("end", () => {
      if (aborted) {
        return;
      }

      try {
        if (!body.trim()) {
          resolve({} as T);
          return;
        }

        const parsed = JSON.parse(body) as T;
        resolve(parsed);
      } catch {
        reject(new AppError("JSON inválido en el body", 400));
      }
    });

    req.on("error", () => {
      if (aborted) {
        return;
      }
      reject(new AppError("Error al leer el body de la solicitud", 500));
    });
  });
}