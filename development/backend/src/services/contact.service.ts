/**
 * ============================================================================
 * MÓDULO: Servicio de Contacto (contact.service.ts)
 * * PROPÓSITO: Lógica de negocio, validación y transformación de datos.
 * ============================================================================
 */
import { 
  createContactMessageInDb, 
  fetchAllContactMessagesFromDb, 
  updateContactMessageStatusInDb, 
  deleteContactMessageFromDb,
  fetchContactMessageByIdFromDb 
} from "../repositories/contact.repository";
import { AppError } from "../types/app-error";

export async function submitContactMessage(data: any) {
  if (!data.name || !data.email || !data.message) {
    throw new AppError("Nombre, email y mensaje son obligatorios.", 400);
  }

  // Transformar el nombre único del frontend en first_name y last_name para la BD
  const nameParts = data.name.trim().split(" ");
  const firstName = nameParts[0] || "Usuario";
  const lastName = nameParts.slice(1).join(" ") || "-";

  const dbData = {
    firstName,
    lastName,
    email: data.email,
    category: data.category || "General",
    reason: data.reason || "Consulta general",
    message: data.message
  };

  return await createContactMessageInDb(dbData);
}

export async function getAdminContactMessages() {
  const messages = await fetchAllContactMessagesFromDb();
  
  // Mapeamos los datos de la BD al formato que espera tu panel de administración en React
  return messages.map((m: any) => ({
    id: m.contact_message_id,
    name: `${m.sender_first_name} ${m.sender_last_name}`.trim(),
    email: m.sender_email,
    category: m.sender_user_category,
    reason: m.subject,
    message: m.message,
    // La magia: Si el status NO es pending, lo consideramos como 'leído'
    is_read: m.status !== 'pending',
    created_at: m.created_at
  }));
}

export async function markMessageAsRead(id: number) {
  // Cambiamos el estado de 'pending' a 'resolved' (Resuelto/Leído)
  const updated = await updateContactMessageStatusInDb(id, 'resolved');
  if (!updated) throw new AppError("Mensaje no encontrado", 404);
  return updated;
}

export async function removeContactMessage(id: number) {
  const deletedCount = await deleteContactMessageFromDb(id);
  if (deletedCount === 0) throw new AppError("Mensaje no encontrado", 404);
  return { message: "Mensaje eliminado permanentemente" };
}

export async function getContactMessageById(id: number) {
  const message = await fetchContactMessageByIdFromDb(id);
  if (!message) throw new AppError("Mensaje no encontrado", 404);

  // Si el mensaje está pendiente, lo marcamos como resuelto (leído) automáticamente
  if (message.status === 'pending') {
    await updateContactMessageStatusInDb(id, 'resolved');
    message.status = 'resolved';
  }

  return {
    id: message.contact_message_id,
    name: `${message.sender_first_name} ${message.sender_last_name}`.trim(),
    email: message.sender_email,
    category: message.sender_user_category,
    reason: message.subject,
    message: message.message,
    is_read: message.status !== 'pending',
    created_at: message.created_at
  };
}