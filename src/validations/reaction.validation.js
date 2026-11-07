import { z } from 'zod';

// Tipos de reacción que acepta la API. Cualquier otro valor
// es rechazado con un 400 explicando las opciones válidas.
export const REACTION_TYPES = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];

export const createReactionSchema = z.object({
  type: z.enum(REACTION_TYPES, `El tipo debe ser uno de: ${REACTION_TYPES.join(', ')}`),
  // Opcional: id del usuario que reacciona (ObjectId de MongoDB).
  // Si no se envía, la reacción se guarda como anónima.
  userId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'El userId debe ser un ObjectId válido')
    .optional(),
});
