import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { config } from '../config.js';
import { User } from '../models/user.model.js';

// Nota: nunca devolvemos passwordHash. El transform toJSON del
// modelo User lo elimina automáticamente al serializar.

const signToken = (user) =>
  jwt.sign({ sub: user.id, email: user.email }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });

// POST /api-backend/auth/register
export async function register(req, res) {
  const { name, lastName, rut, email, password } = req.body;

  if (await User.exists({ email })) {
    return res.status(409).json({ error: 'El email ya está registrado' });
  }
  if (await User.exists({ rut })) {
    return res.status(409).json({ error: 'El RUT ya está registrado' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, lastName, rut, email, passwordHash });

  res.status(201).json({ user, token: signToken(user) });
}

// POST /api-backend/auth/login
export async function login(req, res) {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  const passwordOk = user && (await bcrypt.compare(password, user.passwordHash));

  // Mismo mensaje para "no existe" y "contraseña mala":
  // no se le filtra al atacante cuál de los dos falló.
  if (!passwordOk) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  res.json({ user, token: signToken(user) });
}

// GET /api-backend/auth/me  (requiere token)
export async function me(req, res) {
  // Un token válido pero con un sub que no es ObjectId (ej. emitido
  // cuando la DB usaba ids numéricos) se trata como token inválido.
  if (!mongoose.isValidObjectId(req.user.sub)) {
    return res.status(401).json({ error: 'Token inválido: vuelve a iniciar sesión' });
  }

  const user = await User.findById(req.user.sub);

  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  res.json({ user });
}
