import { z } from 'zod';

export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'El comentario no puede estar vacío')
    .max(500, 'El comentario no puede superar los 500 caracteres'),
  // Opcional: id del usuario que comenta (ObjectId de MongoDB).
  // Si no se envía, el comentario se guarda como anónimo.
  userId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'El userId debe ser un ObjectId válido')
    .optional(),
});
