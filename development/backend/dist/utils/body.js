"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readJsonBody = readJsonBody;
const app_error_1 = require("../types/app-error");
/**
 * POR QUÉ: Se define 1MB como límite estándar para peticiones de API REST
 * (metadatos, formularios de registro, etc.). Superar este valor suele indicar
 * un error de diseño o un intento de ataque, excepto en subida de archivos,
 * los cuales se gestionan por un flujo de streaming distinto para no ocupar
 * memoria RAM del proceso.
 */
const MAX_JSON_BODY_SIZE_BYTES = 1024 * 1024; // 1 MB
/**
 * Descripción: Lee el flujo de datos de la petición y lo convierte en un objeto tipado.
 * POR QUÉ: Utiliza una bandera de control (`aborted`) y el método `req.destroy()`
 * para detener inmediatamente la recepción de datos si se supera el límite.
 * Esto es vital porque, sin el `destroy`, el servidor seguiría recibiendo y
 * descartando bytes del socket desperdiciando ancho de banda. Además, maneja el
 * caso de cuerpos vacíos devolviendo un objeto vacío en lugar de lanzar un
 * error de parseo, mejorando la resiliencia en métodos como DELETE o GET con body accidental.
 * * FLUJO:
 * 1. Escucha trozos de datos (`chunks`) y los acumula en un string.
 * 2. Valida el tamaño acumulado en bytes contra el límite máximo en cada trozo recibido.
 * 3. Al finalizar el flujo, intenta transformar el string acumulado mediante `JSON.parse`.
 * 4. Captura errores de red o de sintaxis JSON, mapeándolos a excepciones `AppError` con códigos HTTP 400, 413 o 500.
 * @param req {HttpRequest} Objeto de la petición que actúa como Readable Stream.
 * @return {Promise<T>} Promesa que resuelve al objeto genérico `T` parseado.
 * @throws {AppError} (413) Si el cuerpo excede 1MB.
 * @throws {AppError} (400) Si el contenido no es un JSON válido.
 * @throws {AppError} (500) Si ocurre un error de lectura en el socket.
 */
async function readJsonBody(req) {
    return new Promise((resolve, reject) => {
        let body = "";
        let totalBytes = 0;
        let aborted = false;
        req.on("data", (chunk) => {
            if (aborted) {
                return;
            }
            totalBytes += chunk.length;
            if (totalBytes > MAX_JSON_BODY_SIZE_BYTES) {
                aborted = true;
                reject(new app_error_1.AppError("Body demasiado grande", 413));
                req.destroy();
                return;
            }
            body += chunk.toString("utf8");
        });
        req.on("end", () => {
            if (aborted) {
                return;
            }
            try {
                if (!body.trim()) {
                    resolve({});
                    return;
                }
                const parsed = JSON.parse(body);
                resolve(parsed);
            }
            catch {
                reject(new app_error_1.AppError("JSON inválido en el body", 400));
            }
        });
        req.on("error", () => {
            if (aborted) {
                return;
            }
            reject(new app_error_1.AppError("Error al leer el body de la solicitud", 500));
        });
    });
}
