import { pool } from "../config/db";

// 1. Obtener todos los roles con sus conteos y lista de permisos
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

// 2. Obtener la lista maestra de permisos disponibles
export async function getAllPermissionsFromDb() {
  const query = `SELECT permission_id, code, description FROM permissions WHERE is_active = TRUE ORDER BY module_code, permission_id`;
  const { rows } = await pool.query(query);
  return rows;
}

// 3. Crear Rol + Asignar Permisos (Transacción)
export async function createRoleWithPermissionsInDb(code: string, name: string, description: string, permisos: number[]) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN'); // Iniciamos transacción
    
    // Insertamos el rol
    const roleRes = await client.query(
      `INSERT INTO roles (code, name, description) VALUES ($1, $2, $3) RETURNING role_id`,
      [code, name, description]
    );
    const roleId = roleRes.rows[0].role_id;

    // Insertamos cada permiso seleccionado
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

// 4. Actualizar Rol + Reemplazar Permisos (Transacción)
export async function updateRoleWithPermissionsInDb(roleId: number, code: string, name: string, description: string, permisos: number[]) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Actualizamos datos básicos
    await client.query(
      `UPDATE roles SET code = $1, name = $2, description = $3, updated_at = NOW() WHERE role_id = $4`,
      [code, name, description, roleId]
    );
    
    // Borramos permisos antiguos
    await client.query(`DELETE FROM role_permissions WHERE role_id = $1`, [roleId]);
    
    // Insertamos los nuevos permisos
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

// 5. Eliminar Rol y Reasignar Usuarios (Transacción)
export async function deleteRoleAndReassignUsersInDb(roleId: number) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Buscamos el ID de "registered_user" para reasignar a los huérfanos
    const regRoleRes = await client.query(`SELECT role_id FROM roles WHERE code = 'registered_user'`);
    const regRoleId = regRoleRes.rows[0].role_id;

    // Protegemos la BD para que nadie borre por accidente los roles vitales
    const targetRoleRes = await client.query(`SELECT code FROM roles WHERE role_id = $1`, [roleId]);
    const targetCode = targetRoleRes.rows[0]?.code;
    if (targetCode === 'super_admin' || targetCode === 'registered_user') {
      throw new Error("PROHIBIDO: No puedes borrar roles del sistema.");
    }

    // Reasignamos usuarios
    await client.query(`UPDATE accounts SET role_id = $1 WHERE role_id = $2`, [regRoleId, roleId]);
    
    // Borramos el rol (la tabla role_permissions se limpia sola por tu ON DELETE CASCADE)
    await client.query(`DELETE FROM roles WHERE role_id = $1`, [roleId]);

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}