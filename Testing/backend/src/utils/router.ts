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
}