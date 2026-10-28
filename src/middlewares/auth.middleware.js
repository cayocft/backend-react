import jwt from 'jsonwebtoken';
import { config } from '../config.js';

// Middleware que exige un token JWT válido.
// Espera el header:  Authorization: Bearer <token>
// Si es válido, deja los datos del token en req.user ({ sub, email })
export function requireAuth(req, res, next) {
  const [type, token] = (req.headers.authorization ?? '').split(' ');

  if (type !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  try {
    req.user = jwt.verify(token, config.jwtSecret);
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}
