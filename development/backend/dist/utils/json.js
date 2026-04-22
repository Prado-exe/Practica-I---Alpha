"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendJson = sendJson;
/**
 * Descripción: Serializa y envía una respuesta JSON al cliente con el código de estado indicado.
 * POR QUÉ: Se implementa el uso de `Buffer.byteLength(body)` para la cabecera `Content-Length` en lugar de usar simplemente `body.length`. Este es un detalle de diseño crítico: `body.length` devuelve la cantidad de caracteres (UTF-16), mientras que `Buffer.byteLength` devuelve el tamaño real en bytes. Si el JSON contiene caracteres especiales, tildes o emojis, el tamaño en bytes es mayor al de caracteres; usar el valor incorrecto provocaría que el cliente corte la respuesta antes de tiempo o que la conexión quede "colgada" esperando datos que nunca llegarán.
 * * FLUJO:
 * 1. Transforma el objeto `data` a una cadena de texto JSON.
 * 2. Escribe las cabeceras HTTP incluyendo el tipo de contenido con charset UTF-8 y la longitud exacta en bytes.
 * 3. Finaliza la respuesta enviando el cuerpo y cerrando el socket.
 * @param res {HttpResponse} El objeto de respuesta del servidor.
 * @param statusCode {number} Código de estado HTTP semántico (ej. 200, 400, 500).
 * @param data {unknown} Los datos (objeto, array o primitivo) que se desean enviar al cliente.
 * @return {void}
 * @throws {TypeError} Si `JSON.stringify` encuentra estructuras circulares que no puede serializar.
 */
function sendJson(res, statusCode, data) {
    const body = JSON.stringify(data);
    res.writeHead(statusCode, {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Length": Buffer.byteLength(body),
    });
    res.end(body);
}
