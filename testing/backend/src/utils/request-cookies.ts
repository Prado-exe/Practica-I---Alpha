<<<<<<< HEAD
/**
 * ============================================================================
 * MÓDULO: Utilidades de Procesamiento de Cookies (request-cookies.ts)
 * * PROPÓSITO: Proveer una herramienta ligera para extraer y desglosar las 
 * cookies enviadas por el cliente en las cabeceras de la petición.
 * * RESPONSABILIDAD: Transformar el string crudo del encabezado 'cookie' en un 
 * objeto literal de JavaScript (Record) para facilitar su acceso en middlewares 
 * y controladores.
 * * DECISIONES DE DISEÑO / SUPUESTOS:
 * - Independencia de Librerías: Se implementa una lógica de parseo manual 
 * mediante `split` y `reduce` para evitar dependencias externas pesadas, 
 * asumiendo que el formato de entrada sigue el estándar RFC 6265.
 * - Integridad de Datos: Se utiliza `decodeURIComponent` sistemáticamente tanto 
 * en llaves como en valores para asegurar la correcta interpretación de 
 * caracteres especiales, espacios o datos serializados que el navegador 
 * codifica al enviar la cabecera.
 * ============================================================================
 */
import type { HttpRequest } from "../types/http";

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
=======
import type { HttpRequest } from "../types/http";

>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export function parseCookies(req: HttpRequest): Record<string, string> {
  const cookieHeader = req.headers.cookie;

  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(";").reduce<Record<string, string>>((acc, part) => {
    const [rawKey, ...rawValue] = part.trim().split("=");

    if (!rawKey) {
      return acc;
    }

    acc[decodeURIComponent(rawKey)] = decodeURIComponent(rawValue.join("="));
    return acc;
  }, {});
}