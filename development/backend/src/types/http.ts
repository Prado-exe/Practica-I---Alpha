import type { IncomingMessage, ServerResponse } from "http";
import type { JwtAccessPayload } from "./auth";

export interface HttpRequest extends IncomingMessage {
  user?: JwtAccessPayload;
}

export type HttpResponse = ServerResponse<IncomingMessage>;

export type Middleware = (
  req: HttpRequest,
  res: HttpResponse
) => Promise<boolean | void> | boolean | void;