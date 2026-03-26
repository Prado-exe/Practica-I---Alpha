import type { HttpResponse } from "../types/http";

export function sendJson(
  res: HttpResponse,
  statusCode: number,
  data: unknown
): void {
  const body = JSON.stringify(data);

  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });

  res.end(body);
}