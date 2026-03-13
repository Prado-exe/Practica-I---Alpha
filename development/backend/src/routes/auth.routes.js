const { readJsonBody } = require("../utils/body");
const { sendJson } = require("../utils/json");
const { registerSchema, loginSchema, verifyCodeSchema } = require("../validators/auth.validators");
const { registerUser, loginUser, verifyEmailCode } = require("../services/auth.service");

async function handleAuthRoutes(req, res) {
  if (req.method === "POST" && req.url === "/api/register") {
    try {
      const body = await readJsonBody(req);
      const payload = registerSchema.parse(body);
      const result = await registerUser(payload);

      sendJson(res, 201, {
        ok: true,
        message: result.message,
        account: result.account,
        verification: result.verification,
      });
      return true;
    } catch (error) {
      if (error.name === "ZodError") {
        sendJson(res, 400, {
          ok: false,
          message: "Datos inválidos",
          errors: error.issues,
        });
        return true;
      }

      sendJson(res, error.statusCode || 500, {
        ok: false,
        message: error.message || "Error interno del servidor",
      });
      return true;
    }
  }

  if (req.method === "POST" && req.url === "/api/login") {
    try {
      const body = await readJsonBody(req);
      const payload = loginSchema.parse(body);
      const result = await loginUser(payload);

      sendJson(res, 200, {
        ok: true,
        message: result.message,
        account: result.account,
      });
      return true;
    } catch (error) {
      if (error.name === "ZodError") {
        sendJson(res, 400, {
          ok: false,
          message: "Datos inválidos",
          errors: error.issues,
        });
        return true;
      }

      sendJson(res, error.statusCode || 500, {
        ok: false,
        message: error.message || "Error interno del servidor",
      });
      return true;
    }
  }

  if (req.method === "POST" && req.url === "/api/verificar") {
    try {
      const body = await readJsonBody(req);
      const payload = verifyCodeSchema.parse(body);
      const result = await verifyEmailCode(payload);

      sendJson(res, 200, result);
      return true;
    } catch (error) {
      if (error.name === "ZodError") {
        sendJson(res, 400, {
          valid: false,
          message: "Datos inválidos",
          errors: error.issues,
        });
        return true;
      }

      sendJson(res, error.statusCode || 500, {
        valid: false,
        message: error.message || "Error interno del servidor",
      });
      return true;
    }
  }

  return false;
}

module.exports = { handleAuthRoutes };