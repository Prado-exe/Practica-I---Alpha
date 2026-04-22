import type { HttpRequest, HttpResponse } from "../types/http";
import { sendJson } from "../utils/json";

import { swaggerSpec } from '../swagger';

// 1. Ruta que devuelve el JSON puro generado por swagger-jsdoc
export function getDocsJsonAction(req: HttpRequest, res: HttpResponse) {
  sendJson(res, 200, swaggerSpec);
}

// 2. Ruta que devuelve el HTML con la interfaz de Swagger UI
export function getSwaggerUIAction(req: HttpRequest, res: HttpResponse) {
  // Código HTML nativo que carga Swagger UI desde un CDN público
  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Documentación API - Observatorio</title>
      <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
      <style>
        body { margin: 0; padding: 0; background: #fafafa; }
      </style>
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js" crossorigin></script>
      <script>
        window.onload = () => {
          window.ui = SwaggerUIBundle({
            url: '/api/docs.json', // 👈 Aquí Swagger lee nuestra ruta JSON
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [
              SwaggerUIBundle.presets.apis,
              SwaggerUIBundle.SwaggerUIStandalonePreset
            ],
          });
        };
      </script>
    </body>
    </html>
  `;

  // Respondemos con texto HTML nativo en lugar de JSON
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(html);
}