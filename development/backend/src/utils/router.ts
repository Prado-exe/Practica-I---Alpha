import type { HttpRequest, HttpResponse, Middleware } from "../types/http";

type Route = {
  method: string;
  path: string;
  regex: RegExp;
  paramNames: string[];
  middlewares: Middleware[];
  handler: Middleware;
};

export class Router {
  private routes: Route[] = [];

  public add(method: string, path: string, middlewares: Middleware[], handler: Middleware) {
    const paramNames: string[] = [];
    
    // Convertimos la ruta "/api/usuarios/:id" a una Expresión Regular
    const regexPath = path.replace(/:([^/]+)/g, (_, paramName) => {
      paramNames.push(paramName);
      return "([^/]+)"; // Captura cualquier valor dinámico
    });
    
    const regex = new RegExp(`^${regexPath}$`);

    this.routes.push({ method, path, regex, paramNames, middlewares, handler });
  }

  public async handle(req: HttpRequest, res: HttpResponse): Promise<boolean> {
    const url = req.url?.split("?")[0] || "/";

    for (const route of this.routes) {
      if (route.method === req.method) {
        // Comparamos la URL usando la Expresión Regular en lugar de igualdad estricta
        const match = url.match(route.regex);

        if (match) {
          // Extraemos los parámetros dinámicos (el :id) y los guardamos en req.params
          const params: Record<string, string> = {};
          route.paramNames.forEach((name, index) => {
            params[name] = match[index + 1];
          });

          // Inyectamos params en el objeto req para que tus controladores puedan usar req.params.id
          (req as any).params = params;

          // Ejecutamos los middlewares (ej: verificación de permisos)
          for (const mw of route.middlewares) {
            const isHandled = await mw(req, res);
            if (isHandled) return true; 
          }

          // Ejecutamos el controlador final
          await route.handler(req, res);
          return true;
        }
      }
    }

    return false;
  }

  public setupSwagger(swaggerSpec: any) {
    // 1. Ruta que expone el JSON crudo generado por swagger-jsdoc
    this.add("GET", "/swagger.json", [], async (req: HttpRequest, res: HttpResponse) => {
      // Usamos as any por si tu interfaz HttpResponse no expone explícitamente writeHead/end
      (res as any).writeHead(200, { "Content-Type": "application/json" });
      (res as any).end(JSON.stringify(swaggerSpec));
    });

    // 2. Ruta que sirve la interfaz gráfica cargando Swagger desde un CDN
    this.add("GET", "/api-docs", [], async (req: HttpRequest, res: HttpResponse) => {
      const html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Documentación API</title>
          <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
        </head>
        <body style="margin: 0; padding: 0;">
          <div id="swagger-ui"></div>
          <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js" crossorigin></script>
          <script>
            window.onload = () => {
              window.ui = SwaggerUIBundle({
                url: '/swagger.json', // 👈 Lee automáticamente tu otra ruta
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
      (res as any).writeHead(200, { "Content-Type": "text/html" });
      (res as any).end(html);
    });
  }
}