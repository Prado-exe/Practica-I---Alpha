"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Router = void 0;
class Router {
    constructor() {
        this.routes = [];
    }
    /**
   * Descripción: Registra una nueva ruta en el sistema, convirtiendo el path en un patrón de búsqueda dinámico.
   * POR QUÉ: Se utiliza una transformación de cadenas a `RegExp` para soportar identificadores dinámicos (ej: `:id`). En lugar de realizar comparaciones de strings estáticos, el motor utiliza grupos de captura de RegEx para identificar qué partes de la URL son variables, lo que permite que una sola definición de ruta atienda múltiples recursos.
   * @param {string} method Método HTTP (GET, POST, etc.).
   * @param {string} path Ruta con posibles marcadores de posición (placeholders).
   * @param {Middleware[]} middlewares Arreglo de funciones de capa intermedia a ejecutar.
   * @param {Middleware} handler Función principal que procesará la petición.
   * @return {void}
   */
    add(method, path, middlewares, handler) {
        const paramNames = [];
        const regexPath = path.replace(/:([^/]+)/g, (_, paramName) => {
            paramNames.push(paramName);
            return "([^/]+)"; // Captura cualquier valor dinámico
        });
        const regex = new RegExp(`^${regexPath}$`);
        this.routes.push({ method, path, regex, paramNames, middlewares, handler });
    }
    /**
   * Descripción: Procesa la petición entrante, busca una coincidencia de ruta y ejecuta la cadena de handlers.
   * POR QUÉ: Gestiona la inyección de parámetros dinámicos directamente en el objeto `req.params` mediante un "workaround" de aserción de tipo (`req as any`). Esto asegura que los controladores descendentes no tengan que parsear la URL manualmente. Además, implementa el "Middleware Chain" donde si un middleware retorna `true`, se interrumpe inmediatamente el flujo, previniendo errores de "Headers already sent".
   * @param {HttpRequest} req Objeto de la petición HTTP.
   * @param {HttpResponse} res Objeto de la respuesta HTTP.
   * @return {Promise<boolean>} Retorna `true` si la ruta fue encontrada y procesada; `false` si no hubo coincidencia (404).
   * @throws {Error} Excepciones lanzadas por middlewares o controladores no controlados.
   */
    async handle(req, res) {
        const url = req.url?.split("?")[0] || "/";
        for (const route of this.routes) {
            if (route.method === req.method) {
                const match = url.match(route.regex);
                if (match) {
                    const params = {};
                    route.paramNames.forEach((name, index) => {
                        params[name] = match[index + 1];
                    });
                    req.params = params;
                    for (const mw of route.middlewares) {
                        const isHandled = await mw(req, res);
                        if (isHandled)
                            return true;
                    }
                    await route.handler(req, res);
                    return true;
                }
            }
        }
        return false;
    }
    /**
   * Descripción: Configura y expone las rutas necesarias para la documentación automática de la API.
   * POR QUÉ: Se optó por servir la interfaz de Swagger UI a través de un CDN dentro de un string de HTML inyectado. Esto evita la necesidad de servir archivos estáticos locales o instalar dependencias de UI pesadas en el servidor, manteniendo el despliegue ligero. El sistema vincula automáticamente la ruta `/swagger.json` con la interfaz visual en `/api-docs` para una experiencia de desarrollo integrada.
   * @param {any} swaggerSpec Objeto de especificación generado por `swagger-jsdoc`.
   * @return {void}
   */
    setupSwagger(swaggerSpec) {
        this.add("GET", "/swagger.json", [], async (req, res) => {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(swaggerSpec));
        });
        this.add("GET", "/api-docs", [], async (req, res) => {
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
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(html);
        });
    }
}
exports.Router = Router;
