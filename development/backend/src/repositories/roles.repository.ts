<<<<<<< HEAD
import { pool } from "../config/db";

// 1. Obtener todos los roles con sus conteos y lista de permisos
=======
/**
 * ============================================================================
 * MÓDULO: Repositorio de Roles y Permisos (roles.repository.ts)
 * * PROPÓSITO: Administrar la persistencia de datos del modelo RBAC (Control 
 * de Acceso Basado en Roles) y sus asignaciones.
 * * RESPONSABILIDAD: Ejecutar operaciones SQL complejas que involucran múltiples 
 * tablas (roles, permisos, usuarios) garantizando la consistencia relacional.
 * * DECISIONES DE DISEÑO / SUPUESTOS:
 * - Consultas Analíticas: Se utiliza SQL avanzado (agregaciones, JOINs múltiples) 
 * para resolver la vista del panel de administración en una sola consulta, 
 * evitando la sobrecarga del bucle "N+1 consultas" en Node.js.
 * - Atomicidad Estricta: Toda mutación que involucre la tabla de cruce 
 * `role_permissions` está envuelta obligatoriamente en transacciones manuales 
 * (`BEGIN`/`COMMIT`) para prevenir estados inconsistentes o roles huérfanos.
 * ============================================================================
 */
import { pool } from "../config/db";

/**
 * Descripción: Recupera un resumen analítico de todos los roles, incluyendo cuántos usuarios lo poseen y qué permisos exactos tienen.
 * POR QUÉ: Se utiliza `COUNT(DISTINCT)` y `array_agg` junto con `LEFT JOIN`. Esto resuelve un problema clásico de SQL conocido como "explosión cartesiana" (Cartesian explosion), donde cruzar una tabla con dos relaciones de uno-a-muchos (usuarios y permisos) multiplica las filas exponencialmente. Esta consulta garantiza que el frontend reciba la radiografía completa del RBAC en un solo y eficiente viaje a la BD.
 * @param {void} No requiere parámetros de entrada.
 * @return {Promise<Array>} Lista de roles con conteos e IDs de permisos.
 * @throws {Ninguna} Errores de sintaxis o conexión burbujean al manejador global.
 */
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function getRolesWithDetailsFromDb() {
  const query = `
    SELECT 
        r.role_id, r.code, r.name, r.description,
        COUNT(DISTINCT a.account_id)::int AS cantidad_usuarios,
        COUNT(DISTINCT rp.permission_id)::int AS cantidad_permisos,
        COALESCE(array_agg(DISTINCT rp.permission_id) FILTER (WHERE rp.permission_id IS NOT NULL), '{}') AS permisos_ids
    FROM roles r
    LEFT JOIN accounts a ON r.role_id = a.role_id
    LEFT JOIN role_permissions rp ON r.role_id = rp.role_id
    GROUP BY r.role_id
    ORDER BY r.role_id ASC;
  `;
  const { rows } = await pool.query(query);
  return rows;
}

<<<<<<< HEAD
// 2. Obtener la lista maestra de permisos disponibles
=======
/**
 * Descripción: Obtiene el catálogo completo de permisos habilitados en el sistema.
 * POR QUÉ: La consulta incluye explícitamente un `ORDER BY module_code, permission_id`. Esto no es meramente estético, sino una decisión de diseño para que el frontend pueda iterar y agrupar automáticamente los checkboxes en bloques visuales (ej. "Módulo de Usuarios", "Módulo de Datasets") sin tener que escribir lógica compleja de ordenamiento en JavaScript.
 * @param {void} No requiere parámetros de entrada.
 * @return {Promise<Array>} Lista de permisos estructurados y ordenados.
 * @throws {Ninguna}
 */
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function getAllPermissionsFromDb() {
  const query = `SELECT permission_id, code, description FROM permissions WHERE is_active = TRUE ORDER BY module_code, permission_id`;
  const { rows } = await pool.query(query);
  return rows;
}

<<<<<<< HEAD
// 3. Crear Rol + Asignar Permisos (Transacción)
export async function createRoleWithPermissionsInDb(code: string, name: string, description: string, permisos: number[]) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN'); // Iniciamos transacción
=======
/**
 * Descripción: Inserta un nuevo rol y mapea secuencialmente sus permisos de forma atómica.
 * POR QUÉ: Se implementa una transacción (`BEGIN/COMMIT`). Si el servidor Node.js crashea o la red se cae a la mitad del bucle `for` de inserción de permisos, el bloque `CATCH` ejecuta un `ROLLBACK`. Esto previene el escenario catastrófico de tener un rol creado en el sistema, pero con un set de permisos incompleto.
 * @param code {string} Código identificador del rol.
 * @param name {string} Nombre legible.
 * @param description {string} Descripción funcional.
 * @param permisos {number[]} Arreglo de IDs correspondientes a los permisos.
 * @return {Promise<number>} El ID autogenerado del nuevo rol.
 * @throws {Error} Lanza error y aborta la transacción si falla alguna inserción.
 */
export async function createRoleWithPermissionsInDb(code: string, name: string, description: string, permisos: number[]) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN'); 
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
    
    // Insertamos el rol
    const roleRes = await client.query(
      `INSERT INTO roles (code, name, description) VALUES ($1, $2, $3) RETURNING role_id`,
      [code, name, description]
    );
    const roleId = roleRes.rows[0].role_id;

<<<<<<< HEAD
    // Insertamos cada permiso seleccionado
=======

>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
    for (const permId of permisos) {
      await client.query(
        `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)`,
        [roleId, permId]
      );
    }
    
    await client.query('COMMIT'); // Guardamos los cambios
    return roleId;
  } catch (error) {
    await client.query('ROLLBACK'); // Si algo falla, deshacemos todo
    throw error;
  } finally {
    client.release();
  }
}

<<<<<<< HEAD
// 4. Actualizar Rol + Reemplazar Permisos (Transacción)
=======
/**
 * Descripción: Modifica los metadatos de un rol y renueva por completo su matriz de accesos.
 * POR QUÉ: Se optó por una estrategia "Wipe and Replace" (Eliminar y Reemplazar) mediante un `DELETE` total seguido de múltiples `INSERT`s en lugar de calcular las diferencias (Diff) en memoria. Al estar dentro de una transacción, esta técnica es muchísimo más simple, menos propensa a bugs lógicos y garantiza que el estado final en BD sea idéntico al array solicitado.
 * @param roleId {number} ID del rol a modificar.
 * @param code {string} Nuevo código identificador.
 * @param name {string} Nuevo nombre legible.
 * @param description {string} Nueva descripción.
 * @param permisos {number[]} Set completo definitivo de permisos.
 * @return {Promise<void>} 
 * @throws {Error} Lanza error si falla el borrado o la inserción de la matriz.
 */
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function updateRoleWithPermissionsInDb(roleId: number, code: string, name: string, description: string, permisos: number[]) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
<<<<<<< HEAD
    // Actualizamos datos básicos
=======

>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
    await client.query(
      `UPDATE roles SET code = $1, name = $2, description = $3, updated_at = NOW() WHERE role_id = $4`,
      [code, name, description, roleId]
    );
    
<<<<<<< HEAD
    // Borramos permisos antiguos
    await client.query(`DELETE FROM role_permissions WHERE role_id = $1`, [roleId]);
    
    // Insertamos los nuevos permisos
=======
  
    await client.query(`DELETE FROM role_permissions WHERE role_id = $1`, [roleId]);
    
  
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
    for (const permId of permisos) {
      await client.query(
        `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)`,
        [roleId, permId]
      );
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

<<<<<<< HEAD
// 5. Eliminar Rol y Reasignar Usuarios (Transacción)
=======
/**
 * Descripción: Elimina un rol del sistema aplicando una estrategia de degradación segura para sus usuarios.
 * POR QUÉ: Contiene una capa de validación "Hardcoded" que evalúa el código del rol destino y aborta la transacción lanzando un error si se intentan eliminar pilares del sistema (`super_admin` o `registered_user`). Adicionalmente, reasigna a los usuarios afectados al rol base en la misma transacción, previniendo que queden "huérfanos" (con `role_id` nulo) lo cual rompería su capacidad de iniciar sesión. Confía en el `ON DELETE CASCADE` de PostgreSQL para limpiar los permisos de forma automática.
 * @param roleId {number} ID del rol a destruir.
 * @return {Promise<void>}
 * @throws {Error} Lanza excepción si se intenta borrar un rol vital o si la transacción fracasa.
 */
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
export async function deleteRoleAndReassignUsersInDb(roleId: number) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
<<<<<<< HEAD
    // Buscamos el ID de "registered_user" para reasignar a los huérfanos
    const regRoleRes = await client.query(`SELECT role_id FROM roles WHERE code = 'registered_user'`);
    const regRoleId = regRoleRes.rows[0].role_id;

    // Protegemos la BD para que nadie borre por accidente los roles vitales
=======
   
    const regRoleRes = await client.query(`SELECT role_id FROM roles WHERE code = 'registered_user'`);
    const regRoleId = regRoleRes.rows[0].role_id;

   
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
    const targetRoleRes = await client.query(`SELECT code FROM roles WHERE role_id = $1`, [roleId]);
    const targetCode = targetRoleRes.rows[0]?.code;
    if (targetCode === 'super_admin' || targetCode === 'registered_user') {
      throw new Error("PROHIBIDO: No puedes borrar roles del sistema.");
    }

<<<<<<< HEAD
    // Reasignamos usuarios
    await client.query(`UPDATE accounts SET role_id = $1 WHERE role_id = $2`, [regRoleId, roleId]);
    
    // Borramos el rol (la tabla role_permissions se limpia sola por tu ON DELETE CASCADE)
=======
   
    await client.query(`UPDATE accounts SET role_id = $1 WHERE role_id = $2`, [regRoleId, roleId]);
    
 
>>>>>>> refactorizacion-y-testeo-de-algunas-cosas
    await client.query(`DELETE FROM roles WHERE role_id = $1`, [roleId]);

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}