import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';

// Columnas públicas de un usuario (nunca exponer passwordHash)
const publicColumns = {
  id: users.id,
  name: users.name,
  lastName: users.lastName,
  rut: users.rut,
  email: users.email,
  createdAt: users.createdAt,
};

// GET /api/users  (público)
export async function listUsers(req, res) {
  const result = await db.select(publicColumns).from(users);
  res.json({ users: result });
}

// GET /api/users/:id  (público, incluye sus posts)
// Ejemplo de consulta relacional con db.query + `with`
export async function getUser(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
    columns: publicColumns,
    with: {
      posts: {
        columns: { id: true, title: true, content: true, createdAt: true },
      },
    },
  });

  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  res.json({ user });
}
