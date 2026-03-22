import type { HttpRequest, HttpResponse, Middleware } from "../types/http";

type Route = {
  method: string;
  path: string;
  middlewares: Middleware[];
  handler: Middleware;
};

export class Router {
  private routes: Route[] = [];

  public add(method: string, path: string, middlewares: Middleware[], handler: Middleware) {
    this.routes.push({ method, path, middlewares, handler });
  }

  public async handle(req: HttpRequest, res: HttpResponse): Promise<boolean> {
    const url = req.url?.split("?")[0] || "/";

    for (const route of this.routes) {
      if (route.method === req.method && route.path === url) {
        
        for (const mw of route.middlewares) {
          const isHandled = await mw(req, res);
          if (isHandled) return true; 
        }

        await route.handler(req, res);
        return true;
      }
    }

    return false;
  }
}