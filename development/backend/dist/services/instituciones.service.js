"use strict";
/**
 * ============================================================================
 * MÓDULO: Servicio de Instituciones (instituciones.service.ts)
 * * PROPÓSITO: Gestionar la lógica de negocio relacionada con el catálogo de
 * instituciones, incluyendo su vinculación con archivos de almacenamiento (logos).
 * * RESPONSABILIDAD: Actuar como intermediario entre los controladores y la base
 * de datos, aplicando reglas de validación de negocio e inyectando recursos
 * externos (URLs prefirmadas de S3/MinIO) antes de entregar los datos al cliente.
 * * DECISIONES DE DISEÑO / SUPUESTOS:
 * - Workaround de Red (Docker): Al operar MinIO localmente, el AWS SDK genera URLs
 * apuntando al host interno de Docker (`storage:9000`). Se asume que el frontend
 * accede vía `localhost`, por lo que se realiza un reemplazo explícito en las
 * cadenas generadas para evitar que las imágenes se rompan en el navegador.
 * ============================================================================
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInstitutions = getInstitutions;
exports.getPublicInstitutions = getPublicInstitutions;
exports.addInstitution = addInstitution;
exports.editInstitution = editInstitution;
exports.removeInstitution = removeInstitution;
const instituciones_repository_1 = require("../repositories/instituciones.repository");
const app_error_1 = require("../types/app-error");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const s3_1 = require("../config/s3");
const env_1 = require("../config/env");
/**
 * Descripción: Recupera todas las instituciones del sistema e inyecta URLs prefirmadas temporales para sus logos.
 * POR QUÉ: Se procesan las URLs en paralelo (`Promise.all`) para no penalizar el tiempo de respuesta. El reemplazo explícito de `storage:9000` por `localhost:9000` es un workaround necesario para puentear la red interna de Docker, permitiendo que el navegador del cliente (que está fuera de la red de Docker) pueda resolver y renderizar las imágenes de MinIO.
 * @param {void} No requiere parámetros.
 * @return {Promise<Array>} Lista de instituciones con la propiedad `logo_url` resuelta.
 * @throws {Ninguna} Los errores de firma de S3 se capturan silenciosamente retornando la institución sin URL para no romper la lista completa.
 */
async function getInstitutions() {
    const instituciones = await (0, instituciones_repository_1.fetchInstitutionsFromDb)();
    const institucionesFirmadas = await Promise.all(instituciones.map(async (inst) => {
        if (inst.storage_key) {
            try {
                const command = new client_s3_1.GetObjectCommand({ Bucket: env_1.env.S3_BUCKET_NAME, Key: inst.storage_key });
                const presignedUrl = await (0, s3_request_presigner_1.getSignedUrl)(s3_1.s3Client, command, { expiresIn: 3600 });
                // 👇 1. APLICAMOS EL REEMPLAZO AQUÍ 👇
                const finalUrl = presignedUrl.replace('storage:9000', 'localhost:9000');
                return { ...inst, logo_url: finalUrl }; // 👈 Usamos finalUrl
            }
            catch (error) {
                console.error(`Error firmando URL:`, error);
                return inst;
            }
        }
        return inst;
    }));
    return institucionesFirmadas;
}
/**
 * Descripción: Recupera un catálogo público de instituciones de forma paginada y con capacidad de búsqueda.
 * POR QUÉ: A diferencia de `getInstitutions`, este método asume que los datos son consumidos por el lado público de la aplicación, donde el volumen puede ser alto, justificando la paginación a nivel de BD (`limit` y `offset`). Reutiliza el workaround de resolución DNS de Docker para MinIO.
 * @param search {string} Término de búsqueda opcional.
 * @param page {number} Página actual (inicia en 1).
 * @param limit {number} Cantidad de registros máximos por página.
 * @return {Promise<Object>} Objeto estructurado con el total de registros, total de páginas y el array de datos procesados.
 * @throws {Ninguna}
 */
async function getPublicInstitutions(search = "", page = 1, limit = 9) {
    const offset = (page - 1) * limit;
    const result = await (0, instituciones_repository_1.fetchPublicInstitutionsPaginated)(search, limit, offset);
    const institucionesFirmadas = await Promise.all(result.data.map(async (inst) => {
        if (inst.storage_key) {
            try {
                const command = new client_s3_1.GetObjectCommand({ Bucket: env_1.env.S3_BUCKET_NAME, Key: inst.storage_key });
                const presignedUrl = await (0, s3_request_presigner_1.getSignedUrl)(s3_1.s3Client, command, { expiresIn: 3600 });
                // 👇 2. Y TAMBIÉN APLICAMOS EL REEMPLAZO AQUÍ 👇
                const finalUrl = presignedUrl.replace('storage:9000', 'localhost:9000');
                return { ...inst, logo_url: finalUrl }; // 👈 Usamos finalUrl
            }
            catch (error) {
                return inst;
            }
        }
        return inst;
    }));
    return {
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
        data: institucionesFirmadas
    };
}
/**
 * Descripción: Valida y registra una nueva institución en la base de datos vinculando su logotipo subido a S3.
 * POR QUÉ: Se imponen validaciones de negocio estrictas en la capa de servicio (ej. longitud de descripción) para interceptar errores semánticos antes de llegar a la base de datos. Se exige obligatoriamente la metadata del archivo (`fileData`) asumiendo que el diseño del frontend requiere un logo para renderizar la tarjeta de la institución.
 * @param instData {any} Objeto con los datos de texto de la institución.
 * @param fileData {any} Metadatos del archivo de imagen subido previamente.
 * @param accountId {number} ID del usuario administrador que realiza la acción.
 * @return {Promise<Object>} El registro de la institución recién creada.
 * @throws {AppError} 400 si faltan campos críticos o si las reglas de longitud son violadas.
 */
async function addInstitution(instData, fileData, accountId) {
    // Validaciones estrictas basadas en tus tablas y UI
    if (!instData.legal_name || !instData.institution_type || !instData.country_name || !instData.description || !instData.data_role) {
        throw new app_error_1.AppError("Faltan campos obligatorios de la institución.", 400);
    }
    if (instData.description.length > 1000) {
        throw new app_error_1.AppError("La descripción no puede superar los 1000 caracteres.", 400);
    }
    if (!fileData || !fileData.storage_key || !fileData.file_url) {
        throw new app_error_1.AppError("Los datos de la imagen (logo) son obligatorios.", 400);
    }
    return await (0, instituciones_repository_1.createInstitutionInDb)(instData, fileData, accountId);
}
/**
 * Descripción: Modifica los datos de una institución existente, permitiendo opcionalmente la actualización de su logo.
 * POR QUÉ: El diseño permite `fileData` como un valor omitible o nulo. Esto facilita el flujo del frontend donde el administrador puede corregir un error tipográfico en el texto sin estar obligado a volver a subir la imagen del logo.
 * @param id {number} Identificador único de la institución.
 * @param instData {any} Nuevos datos de texto.
 * @param fileData {any | null} Nuevos metadatos del archivo de imagen (puede ser nulo).
 * @param accountId {number} ID del usuario administrador que realiza la edición.
 * @return {Promise<Object>} El registro de la institución actualizada.
 * @throws {AppError} 400 si las validaciones semánticas fallan.
 */
async function editInstitution(id, instData, fileData, accountId) {
    if (!instData.legal_name || !instData.institution_type || !instData.country_name || !instData.description || !instData.data_role) {
        throw new app_error_1.AppError("Faltan campos obligatorios de la institución.", 400);
    }
    if (instData.description.length > 1000) {
        throw new app_error_1.AppError("La descripción no puede superar los 1000 caracteres.", 400);
    }
    // Nota: fileData puede ser null si no cambió la imagen, el repositorio lo maneja.
    const updated = await (0, instituciones_repository_1.updateInstitutionInDb)(id, instData, fileData, accountId);
    return updated;
}
/**
 * Descripción: Elimina lógicamente o físicamente (según implementación de BD) una institución.
 * POR QUÉ: Valida la existencia basándose en el conteo de filas afectadas (`deletedCount`) en lugar de hacer un `SELECT` previo. Esta decisión optimiza las consultas a la base de datos evitando operaciones de lectura redundantes.
 * @param id {number} ID de la institución a eliminar.
 * @return {Promise<Object>} Mensaje de confirmación estándar.
 * @throws {AppError} 404 si el ID proporcionado no existía en la base de datos.
 */
async function removeInstitution(id) {
    const deletedCount = await (0, instituciones_repository_1.deleteInstitutionFromDb)(id);
    if (deletedCount === 0) {
        throw new app_error_1.AppError("Institución no encontrada", 404);
    }
    return { message: "Institución eliminada correctamente" };
}
