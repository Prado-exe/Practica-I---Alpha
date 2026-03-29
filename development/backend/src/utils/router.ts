<<<<<<< HEAD
=======
/**
 * ============================================================================
 * MÓDULO: Sistema de Enrutamiento Dinámico (router.ts)
 * * PROPÓSITO: Centralizar la lógica de registro, coincidencia (matching) y 
 * despacho de rutas HTTP para la aplicación.
 * * RESPONSABILIDAD: Transformar rutas amigables en expresiones regulares, 
 * extraer parámetros dinámicos de la URL y orquestar la ejecución de 
 * middlewares junto con el controlador final.
 * * DECISIONES DE DISEÑO / SUPUESTOS:
 * - Independencia de Frameworks: Se construye un motor de búsqueda de rutas 
 * basado en RegEx nativo en lugar de usar librerías externas. Esto minimiza el 
 * tamaño del bundle y proporciona un control total sobre el ciclo de vida de 
 * la petición.
 * - Soporte REST Nativo: El diseño asume que los parámetros de ruta siguen 
 * la convención `:nombre_parametro`, permitiendo una definición de API 
 * semántica y flexible.
 * ============================================================================
 */
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
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
<<<<<<< HEAD

  public add(method: string, path: string, middlewares: Middleware[], handler: Middleware) {
    const paramNames: string[] = [];
    
    // Convertimos la ruta "/api/usuarios/:id" a una Expresión Regular
=======
  /**
 * Descripción: Registra una nueva ruta en el sistema, convirtiendo el path en un patrón de búsqueda dinámico.
 * POR QUÉ: Se utiliza una transformación de cadenas a `RegExp` para soportar identificadores dinámicos (ej: `:id`). En lugar de realizar comparaciones de strings estáticos, el motor utiliza grupos de captura de RegEx para identificar qué partes de la URL son variables, lo que permite que una sola definición de ruta atienda múltiples recursos.
 * @param {string} method Método HTTP (GET, POST, etc.).
 * @param {string} path Ruta con posibles marcadores de posición (placeholders).
 * @param {Middleware[]} middlewares Arreglo de funciones de capa intermedia a ejecutar.
 * @param {Middleware} handler Función principal que procesará la petición.
 * @return {void}
 */
  public add(method: string, path: string, middlewares: Middleware[], handler: Middleware) {
    const paramNames: string[] = [];
    
    
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
    const regexPath = path.replace(/:([^/]+)/g, (_, paramName) => {
      paramNames.push(paramName);
      return "([^/]+)"; // Captura cualquier valor dinámico
    });
    
    const regex = new RegExp(`^${regexPath}$`);

    this.routes.push({ method, path, regex, paramNames, middlewares, handler });
  }

<<<<<<< HEAD
=======
  /**
 * Descripción: Procesa la petición entrante, busca una coincidencia de ruta y ejecuta la cadena de handlers.
 * POR QUÉ: Gestiona la inyección de parámetros dinámicos directamente en el objeto `req.params` mediante un "workaround" de aserción de tipo (`req as any`). Esto asegura que los controladores descendentes no tengan que parsear la URL manualmente. Además, implementa el "Middleware Chain" donde si un middleware retorna `true`, se interrumpe inmediatamente el flujo, previniendo errores de "Headers already sent".
 * @param {HttpRequest} req Objeto de la petición HTTP.
 * @param {HttpResponse} res Objeto de la respuesta HTTP.
 * @return {Promise<boolean>} Retorna `true` si la ruta fue encontrada y procesada; `false` si no hubo coincidencia (404).
 * @throws {Error} Excepciones lanzadas por middlewares o controladores no controlados.
 */
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
  public async handle(req: HttpRequest, res: HttpResponse): Promise<boolean> {
    const url = req.url?.split("?")[0] || "/";

    for (const route of this.routes) {
      if (route.method === req.method) {
<<<<<<< HEAD
        // Comparamos la URL usando la Expresión Regular en lugar de igualdad estricta
        const match = url.match(route.regex);

        if (match) {
          // Extraemos los parámetros dinámicos (el :id) y los guardamos en req.params
=======
      
        const match = url.match(route.regex);

        if (match) {
        
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
          const params: Record<string, string> = {};
          route.paramNames.forEach((name, index) => {
            params[name] = match[index + 1];
          });

<<<<<<< HEAD
          // Inyectamos params en el objeto req para que tus controladores puedan usar req.params.id
          (req as any).params = params;

          // Ejecutamos los middlewares (ej: verificación de permisos)
=======
          (req as any).params = params;

>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
          for (const mw of route.middlewares) {
            const isHandled = await mw(req, res);
            if (isHandled) return true; 
          }

<<<<<<< HEAD
          // Ejecutamos el controlador final
=======
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
          await route.handler(req, res);
          return true;
        }
      }
    }

    return false;
  }
<<<<<<< HEAD
=======
  /**
 * Descripción: Configura y expone las rutas necesarias para la documentación automática de la API.
 * POR QUÉ: Se optó por servir la interfaz de Swagger UI a través de un CDN dentro de un string de HTML inyectado. Esto evita la necesidad de servir archivos estáticos locales o instalar dependencias de UI pesadas en el servidor, manteniendo el despliegue ligero. El sistema vincula automáticamente la ruta `/swagger.json` con la interfaz visual en `/api-docs` para una experiencia de desarrollo integrada.
 * @param {any} swaggerSpec Objeto de especificación generado por `swagger-jsdoc`.
 * @return {void}
 */
  public setupSwagger(swaggerSpec: any) {
    this.add("GET", "/swagger.json", [], async (req: HttpRequest, res: HttpResponse) => {
      (res as any).writeHead(200, { "Content-Type": "application/json" });
      (res as any).end(JSON.stringify(swaggerSpec));
    });

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
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
}