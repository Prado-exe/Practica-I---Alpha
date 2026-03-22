import http from "http";
import { env } from "./config/env";
import { sendJson } from "./utils/json";
import { authRouter } from "./routes/auth.routes"; 
import { testDbConnection } from "./config/db";
import { warmupMailer } from "./utils/mailer";
import { applySecurityHeaders } from "./utils/security-headers";

const server = http.createServer(async (req, res) => {
  applySecurityHeaders(res);

  res.setHeader("Access-Control-Allow-Origin", env.FRONTEND_ORIGIN);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const handled = await authRouter.handle(req, res);
  if (handled) return; 

  sendJson(res, 404, { ok: false, message: "Ruta no encontrada" });
});

async function bootstrap(): Promise<void> {
  try {
    await testDbConnection();

    server.listen(env.PORT, () => {
      console.log(`Server listening on port ${env.PORT}`);
    });

    void warmupMailer();
  } catch (error) {
    console.error("Error al iniciar el servidor:", error);
    process.exit(1);
  }
}

void bootstrap();