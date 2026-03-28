import type { HttpRequest } from "../types/http";

export function parseCookies(req: HttpRequest): Record<string, string> {
  const cookieHeader = req.headers.cookie;

  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(";").reduce<Record<string, string>>((acc, part) => {
    const [rawKey, ...rawValue] = part.trim().split("=");

    if (!rawKey) {
      return acc;
    }

    acc[decodeURIComponent(rawKey)] = decodeURIComponent(rawValue.join("="));
    return acc;
  }, {});
}