/**
 * ============================================================================
 * MÓDULO: Punto de Entrada Principal (server.ts)
 * * PROPÓSITO: Configurar e inicializar el servidor HTTP nativo de Node.js, 
 * gestionando el ciclo de vida de la aplicación.
 * * RESPONSABILIDAD: Orquestar el arranque de servicios (Base de Datos, Mailer), 
 * aplicar políticas de seguridad globales (CORS, Seguridad de Cabeceras) y 
 * despachar peticiones a los enrutadores correspondientes.
 * * SUPUESTOS Y DECISIONES DE DISEÑO:
 * - Servidor Nativo: Se prescinde de frameworks como Express para reducir la 
 * superficie de ataque y optimizar el rendimiento mediante el uso directo 
 * del módulo `http` de Node.js.
 * - Jerarquía de Enrutamiento: Se prioriza el enrutador de sistema (`systemRouter`) 
 * sobre el de negocio (`authRouter`) para asegurar que la documentación 
 * técnica sea accesible independientemente del estado de las rutas de la API.
 * - Resiliencia Crítica: Se implementa un "Master Try/Catch" que envuelve toda 
 * la lógica del servidor para evitar que excepciones no controladas en 
 * controladores específicos provoquen la caída del proceso de Node.js.
 * ============================================================================
 */
import http from "http";
import { env } from "./config/env";
import { sendJson } from "./utils/json";
import { authRouter } from "./routes/auth.routes"; 
import { testDbConnection } from "./config/db";
import { warmupMailer } from "./utils/mailer";
import { applySecurityHeaders } from "./utils/security-headers";

import { Router } from './utils/router';
import { swaggerSpec } from './config/swagger';


const systemRouter = new Router();
systemRouter.setupSwagger(swaggerSpec);

/**
 * Descripción: Manejador principal de peticiones del servidor HTTP.
 * POR QUÉ: Debido al uso de un servidor nativo, la configuración de CORS y 
 * el manejo de peticiones `OPTIONS` (preflight) se realizan manualmente para 
 * permitir la comunicación segura con el dominio del frontend. La 
 * inyección de `applySecurityHeaders` al inicio garantiza que todas las 
 * respuestas, incluidas las de error, cumplan con las políticas de endurecimiento 
 * (hardening) del sistema.
 * * FLUJO:
 * 1. Aplica cabeceras de seguridad y configura políticas de CORS.
 * 2. Intercepta y resuelve peticiones `OPTIONS` de forma inmediata.
 * 3. Intenta resolver la petición a través del enrutador de documentación.
 * 4. Si no coincide, intenta resolverla mediante el enrutador de autenticación.
 * 5. Emite un error 404 estandarizado si ningún enrutador procesó la URL.
 * 6. Captura fallos críticos enviando un error 500 para mantener la disponibilidad.
 * @param req {IncomingMessage} Objeto de la petición entrante.
 * @param res {ServerResponse} Objeto de respuesta para el cliente.
 * @return {Promise<void>} 
 * @throws {Ninguna} Los errores se capturan internamente para evitar el cierre del proceso.
 */
const server = http.createServer(async (req, res) => {
  
  try {
    applySecurityHeaders(res);

    if (req.url && req.url.startsWith("/api-docs")) {
      res.setHeader(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com; style-src 'self' 'unsafe-inline' https://unpkg.com; img-src 'self' data: https://validator.swagger.io;"
      );
    }

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

    const docsHandled = await systemRouter.handle(req, res);
    if (docsHandled) return;

    const handled = await authRouter.handle(req, res);
    if (handled) return; 

    sendJson(res, 404, { ok: false, message: "Ruta no encontrada" });

  } catch (error) {
    console.error("🔥 Error CRÍTICO no capturado en el servidor:", error);
    
    if (!res.headersSent) {
      sendJson(res, 500, { ok: false, message: "Error interno del servidor" });
    }
  }
});

/**
 * Descripción: Función de arranque (Bootstrap) que inicializa la infraestructura necesaria.
 * POR QUÉ: Se utiliza un diseño de inicio secuencial donde la conexión a la 
 * base de datos se valida antes de abrir el puerto del servidor. Esto 
 * asegura que la aplicación no entre en un estado de "listo" (ready) si su 
 * dependencia principal de datos no es alcanzable, evitando errores en 
 * cascada durante el tráfico inicial.
 * * FLUJO:
 * 1. Intenta establecer conexión con PostgreSQL.
 * 2. Inicia la escucha de peticiones en el puerto configurado.
 * 3. Ejecuta el calentamiento del servicio de correo (Mailer) de forma asíncrona.
 * 4. Ante cualquier fallo en el arranque, detiene el proceso con un código de salida 1.
 * @return {Promise<void>}
 * @throws {Error} Si la base de datos o la configuración del servidor fallan críticamente.
 */
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