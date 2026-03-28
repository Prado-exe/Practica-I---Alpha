import { swaggerSpec } from '../config/swagger';

export const getSwaggerHtml = (): string => {
  // Convertimos el objeto a un string de JSON válido para inyectarlo en el JS
  const specJson = JSON.stringify(swaggerSpec);

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Documentación API</title>
      <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js" crossorigin></script>
      <script>
        window.onload = () => {
          window.ui = SwaggerUIBundle({
            spec: ${specJson}, // 👈 Inyectamos tu configuración aquí
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
};