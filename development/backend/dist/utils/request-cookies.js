"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCookies = parseCookies;
/**
 * Descripción: Convierte el encabezado 'cookie' de una petición HTTP en un
 * objeto de pares clave-valor.
 * POR QUÉ: El proceso utiliza un acumulador que valida la existencia de la
 * clave antes de la inserción, lo que evita la creación de entradas "undefined"
 * ante separadores vacíos o malformados. Se emplea
 * `rawValue.join("=")` al reconstruir el valor para manejar correctamente
 * cookies cuyos valores puedan contener el carácter '=' (común en algunos
 * tokens codificados en base64), garantizando que no se pierda información
 * durante el desglose.
 * ● Parámetros (Params):
 * - req (HttpRequest): Objeto de la petición que contiene los encabezados.
 * ● Retorno (Return):
 * - (Record<string, string>): Un objeto donde las llaves son los nombres
 * de las cookies y los valores su contenido decodificado.
 * ● Excepciones (Throws):
 * - (URIError): Puede lanzarse si `decodeURIComponent` encuentra una
 * secuencia de escape de caracteres mal formada en el string de cookies.
 */
function parseCookies(req) {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) {
        return {};
    }
    return cookieHeader.split(";").reduce((acc, part) => {
        const [rawKey, ...rawValue] = part.trim().split("=");
        if (!rawKey) {
            return acc;
        }
        acc[decodeURIComponent(rawKey)] = decodeURIComponent(rawValue.join("="));
        return acc;
    }, {});
}
