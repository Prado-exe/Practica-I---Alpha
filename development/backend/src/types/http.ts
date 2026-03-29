<<<<<<< HEAD
import type { IncomingMessage, ServerResponse } from "http";
import type { JwtAccessPayload } from "./auth";

=======
/**
 * ============================================================================
 * MÓDULO: Tipado de Transporte HTTP (http.ts)
 * * PROPÓSITO: Definir los contratos de datos y tipos de función para el 
 * manejo de peticiones y respuestas dentro del servidor.
 * * RESPONSABILIDAD: Estandarizar la interfaz de comunicación entre el 
 * enrutador, los middlewares y los controladores de la aplicación.
 * * DECISIONES DE DISEÑO / SUPUESTOS:
 * - Extensión Nativa: Se opta por extender `IncomingMessage` en lugar de 
 * crear una abstracción pesada. Esto permite aprovechar toda la funcionalidad 
 * estándar de Node.js manteniendo un perfil de rendimiento alto y bajo 
 * consumo de memoria.
 * - Inyección de Contexto: La interfaz `HttpRequest` incluye un campo opcional 
 * `user`. Este es el "puente" crítico que permite a los middlewares de 
 * autenticación inyectar la identidad del usuario para que esté disponible 
 * en cualquier controlador posterior sin re-validar el token.
 * ============================================================================
 */
import type { IncomingMessage, ServerResponse } from "http";
import type { JwtAccessPayload } from "./auth";

/**
 * Descripción: Interfaz extendida de la petición HTTP nativa de Node.js.
 * POR QUÉ: Se agrega la propiedad `user` (JwtAccessPayload) para permitir la 
 * trazabilidad de la sesión a lo largo del ciclo de vida de la petición. Al 
 * ser opcional (`?`), permite que el mismo tipo de objeto sea utilizado tanto 
 * en rutas públicas (donde `user` es undefined) como en rutas protegidas.
 */
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export interface HttpRequest extends IncomingMessage {
  user?: JwtAccessPayload;
}

<<<<<<< HEAD
export type HttpResponse = ServerResponse<IncomingMessage>;

=======
/**
 * Descripción: Alias para la respuesta del servidor estándar de Node.js.
 * POR QUÉ: Se define este tipo para mantener la coherencia semántica en la 
 * firma de los métodos del proyecto, asegurando que cualquier cambio futuro 
 * en la librería de transporte solo requiera una actualización en este punto 
 * central.
 */
export type HttpResponse = ServerResponse<IncomingMessage>;

/**
 * Descripción: Definición del contrato para funciones de capa intermedia (Middlewares).
 * POR QUÉ: El tipo de retorno `Promise<boolean | void> | boolean | void` es una 
 * decisión de diseño clave para el enrutador personalizado. Retornar `true` 
 * (truthy) actúa como una señal de interrupción: indica que el middleware ha 
 * enviado una respuesta al cliente (ej. un error 401) y que el enrutador no 
 * debe proceder con el siguiente handler en la cadena, previniendo errores de 
 * "Headers already sent".
 * @param req {HttpRequest} Objeto de la petición (posiblemente con contexto de usuario).
 * @param res {HttpResponse} Objeto de respuesta para enviar datos o errores.
 * @return {Promise<boolean | void> | boolean | void} `true` para detener el flujo, `void/false` para continuar.
 * @throws {Error} Excepciones no controladas que deben ser capturadas por el servidor principal.
 */
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export type Middleware = (
  req: HttpRequest,
  res: HttpResponse
) => Promise<boolean | void> | boolean | void;