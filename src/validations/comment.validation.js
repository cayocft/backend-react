import { z } from 'zod';

export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'El comentario no puede estar vacío')
    .max(500, 'El comentario no puede superar los 500 caracteres'),
  // Opcional: id del usuario que comenta.
  // Si no se envía, el comentario se guarda como anónimo.
  userId: z.number().int('El userId debe ser un número entero').positive('El userId debe ser positivo').optional(),
});
