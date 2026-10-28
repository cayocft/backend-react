import { z } from 'zod';

// Formato esperado: 12.345.678-9 (puntos y guion obligatorios)
const RUT_FORMAT = /^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/;

export const registerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  rut: z.string().regex(RUT_FORMAT, 'El RUT debe tener el formato 12.345.678-9'),
  email: z.email('Debe ser un email válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const loginSchema = z.object({
  email: z.email('Debe ser un email válido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});
