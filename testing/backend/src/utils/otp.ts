import { createHash, randomInt } from "crypto";

export function generateOtpCode(length = 6): string {
  let code = "";

  for (let i = 0; i < length; i += 1) {
    code += randomInt(0, 10).toString();
  }

  return code;
}

export function hashOtpCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}