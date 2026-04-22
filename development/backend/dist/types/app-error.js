"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
/**
 * ============================================================================
 * MÓDULO: Definición de Errores de Aplicación (app-error.ts)
 * * PROPÓSITO: Establecer una clase de error personalizada que unifique la
 * lógica de negocio con el protocolo de transporte (HTTP).
 * * RESPONSABILIDAD: Permitir que cualquier capa del sistema (servicios,
 * repositorios, utilidades) lance excepciones que contengan no solo un mensaje,
 * sino también el código de estado HTTP semántico correspondiente.
 * * DECISIONES DE DISEÑO / SUPUESTOS:
 * - Extensibilidad: Hereda de la clase nativa `Error` de JavaScript para
 * mantener la captura automática de Stack Traces y la compatibilidad con
 * bloques `try/catch` estándar.
 * - Desacoplamiento: Esta clase es la clave para que los servicios no tengan
 * que manejar objetos de respuesta `res`, delegando la decisión del código
 * HTTP a la captura del error en los controladores o middlewares.
 * ============================================================================
 */
/**
 * Descripción: Clase base para excepciones controladas dentro de la lógica del sistema.
 * POR QUÉ: Se define la propiedad `statusCode` como pública y de solo lectura para que sea inmutable una vez lanzado el error. Al asignar explícitamente `this.name = "AppError"`, permitimos que los bloques de captura (como en `auth.routes.ts`) utilicen `instanceof` para diferenciar errores previstos de la aplicación de errores inesperados del motor o librerías externas.
 */
class AppError extends Error {
    /**
     * Descripción: Inicializa una nueva instancia de error con mensaje y estado HTTP.
     * POR QUÉ: El valor por defecto `500` asegura que, ante cualquier omisión del desarrollador, el sistema siga el principio de seguridad de no revelar éxito si algo falló. Llama a `super(message)` para garantizar que el mensaje de error sea procesado correctamente por el motor de JavaScript y sea visible en los logs.
     * @param message {string} Descripción legible del error destinada al cliente o logs.
     * @param statusCode {number} Código de estado HTTP (ej. 400, 401, 403, 404). Por defecto 500.
     * @return {AppError} Una instancia tipada de error.
     * @throws {Ninguna}
     */
    constructor(message, statusCode = 500) {
        super(message);
        this.name = "AppError";
        this.statusCode = statusCode;
    }
}
exports.AppError = AppError;
