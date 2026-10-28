import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';

// Quita campos sensibles antes de responder al cliente.
// NUNCA devuelvas el passwordHash en una respuesta.
const toPublicUser = ({ passwordHash, ...user }) => user;

const signToken = (user) =>
  jwt.sign({ sub: user.id, email: user.email }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });

// POST /api-backend/auth/register
export async function register(req, res) {
  const { name, lastName, rut, email, password } = req.body;

  const [existingEmail] = await db.select().from(users).where(eq(users.email, email));
  if (existingEmail) {
    return res.status(409).json({ error: 'El email ya está registrado' });
  }

  const [existingRut] = await db.select().from(users).where(eq(users.rut, rut));
  if (existingRut) {
    return res.status(409).json({ error: 'El RUT ya está registrado' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db
    .insert(users)
    .values({ name, lastName, rut, email, passwordHash })
    .returning();

  res.status(201).json({ user: toPublicUser(user), token: signToken(user) });
}

// POST /api-backend/auth/login
export async function login(req, res) {
  const { email, password } = req.body;

  const [user] = await db.select().from(users).where(eq(users.email, email));
  const passwordOk = user && (await bcrypt.compare(password, user.passwordHash));

  // Mismo mensaje para "no existe" y "contraseña mala":
  // no se le filtra al atacante cuál de los dos falló.
  if (!passwordOk) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  res.json({ user: toPublicUser(user), token: signToken(user) });
}

// GET /api-backend/auth/me  (requiere token)
export async function me(req, res) {
  const [user] = await db.select().from(users).where(eq(users.id, req.user.sub));

  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  res.json({ user: toPublicUser(user) });
}
