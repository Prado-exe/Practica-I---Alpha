import http from "http";
import { env } from "./config/env";
import { sendJson } from "./utils/json";
import { authRouter } from "./routes/auth.routes"; 
import { testDbConnection } from "./config/db";
import { warmupMailer } from "./utils/mailer";
import { applySecurityHeaders } from "./utils/security-headers";

import { Router } from './utils/router';
import { swaggerSpec } from './config/swagger';

// 1️⃣ Creamos un enrutador global/sistema y le montamos Swagger
const systemRouter = new Router();
systemRouter.setupSwagger(swaggerSpec);

const server = http.createServer(async (req, res) => {
  // Envolvemos TODO en un try/catch maestro
  try {
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

    // 2️⃣ Evaluamos primero las rutas de documentación (/api-docs y /swagger.json)
    const docsHandled = await systemRouter.handle(req, res);
    if (docsHandled) return;

    // 3️⃣ Luego evaluamos las rutas de tu API real (Auth)
    const handled = await authRouter.handle(req, res);
    if (handled) return; 

    // Si nadie respondió, lanzamos el 404
    sendJson(res, 404, { ok: false, message: "Ruta no encontrada" });

  } catch (error) {
    // Si cualquier ruta explota, lo atrapamos aquí y evitamos que el servidor muera
    console.error("🔥 Error CRÍTICO no capturado en el servidor:", error);
    
    // Si la conexión no se ha cerrado, enviamos un 500
    if (!res.headersSent) {
      sendJson(res, 500, { ok: false, message: "Error interno del servidor" });
    }
  }
});

async function bootstrap(): Promise<void> {
  try {
    await testDbConnection();

    server.listen(env.PORT, () => {
      console.log(`Server listening on port ${env.PORT}`);
      console.log(`📄 Swagger docs disponibles en: http://localhost:${env.PORT}/api-docs`); // 👈 Un pequeño log extra para encontrarlo rápido
    });

    void warmupMailer();
  } catch (error) {
    console.error("Error al iniciar el servidor:", error);
    process.exit(1);
  }
}

void bootstrap();