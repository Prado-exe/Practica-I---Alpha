/**
 * ============================================================================
 * MÓDULO: Repositorio de Contacto (contact.repository.ts)
 * * PROPÓSITO: Administrar el acceso a datos de los mensajes de contacto.
 * ============================================================================
 */
import { pool } from "../config/db";

export async function createContactMessageInDb(data: any) {
  const query = `
    INSERT INTO contact_messages (
      sender_first_name, sender_last_name, sender_email, 
      sender_user_category, subject, message, status
    ) VALUES ($1, $2, $3, $4, $5, $6, 'pending')
    RETURNING contact_message_id
  `;
  const result = await pool.query(query, [
    data.firstName,
    data.lastName,
    data.email,
    data.category,
    data.reason, // Se guarda en 'subject'
    data.message
  ]);
  return result.rows[0];
}

export async function fetchAllContactMessagesFromDb() {
  const query = `
    SELECT * FROM contact_messages
    ORDER BY created_at DESC
  `;
  const { rows } = await pool.query(query);
  return rows;
}

export async function updateContactMessageStatusInDb(id: number, status: string) {
  const query = `
    UPDATE contact_messages 
    SET status = $1, updated_at = NOW() 
    WHERE contact_message_id = $2 
    RETURNING *
  `;
  const { rows } = await pool.query(query, [status, id]);
  return rows[0] || null;
}

export async function deleteContactMessageFromDb(id: number) {
  const query = `DELETE FROM contact_messages WHERE contact_message_id = $1`;
  const { rowCount } = await pool.query(query, [id]);
  return rowCount ?? 0;
}

export async function fetchContactMessageByIdFromDb(id: number) {
  const query = `SELECT * FROM contact_messages WHERE contact_message_id = $1`;
  const { rows } = await pool.query(query, [id]);
  return rows[0] || null;
}