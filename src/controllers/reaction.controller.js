import { and, count, eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { posts, reactions, users } from '../db/schema.js';

const parseId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

// Agrupa las reacciones de UN post por tipo.
// countReactions(1) → { like: 3, sad: 1 }
async function countReactions(postId) {
  const rows = await db
    .select({ type: reactions.type, total: count() })
    .from(reactions)
    .where(eq(reactions.postId, postId))
    .groupBy(reactions.type);

  const counts = {};
  for (const row of rows) counts[row.type] = row.total;
  return counts;
}

// GET /api-backend/posts/:postId/reactions  (público)
// Devuelve el conteo por tipo + el detalle de cada reacción.
// user: null → la reacción es anónima (sin iniciar sesión).
export async function listReactions(req, res) {
  const postId = parseId(req.params.postId);
  if (!postId) return res.status(400).json({ error: 'ID de post inválido' });

  const [post] = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, postId));
  if (!post) return res.status(404).json({ error: 'Post no encontrado' });

  const list = await db
    .select({
      id: reactions.id,
      type: reactions.type,
      createdAt: reactions.createdAt,
      user: { id: users.id, name: users.name },
    })
    .from(reactions)
    .leftJoin(users, eq(reactions.userId, users.id))
    .where(eq(reactions.postId, postId));

  res.json({
    counts: await countReactions(postId),
    reactions: list.map(({ user, ...reaction }) => ({
      ...reaction,
      user: user?.id ? user : null,
    })),
  });
}

// POST /api-backend/posts/:postId/reactions  (público)
// Body: { "type": "like", "userId": 1 }   ← userId es opcional.
// Sin userId la reacción queda anónima. El autor SÍ puede reaccionar
// a su propio post.
export async function createReaction(req, res) {
  const postId = parseId(req.params.postId);
  if (!postId) return res.status(400).json({ error: 'ID de post inválido' });

  const [post] = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, postId));
  if (!post) return res.status(404).json({ error: 'Post no encontrado' });

  const { type, userId } = req.body;

  if (userId != null) {
    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId));
    if (!user) {
      return res.status(400).json({ error: 'El userId no corresponde a un usuario existente' });
    }

    // Un usuario registrado no puede repetir el MISMO tipo en el MISMO post
    // (pero sí puede usar tipos distintos, ej. like + sad).
    const [existing] = await db
      .select({ id: reactions.id })
      .from(reactions)
      .where(and(eq(reactions.postId, postId), eq(reactions.userId, userId), eq(reactions.type, type)));

    if (existing) {
      return res.status(409).json({ error: 'Ya reaccionaste a este post con este tipo' });
    }
  }

  const [reaction] = await db
    .insert(reactions)
    .values({ postId, type, userId: userId ?? null })
    .returning();

  // Devolvemos el conteo actualizado para que el frontend
  // no tenga que hacer otra petición.
  res.status(201).json({ reaction, counts: await countReactions(postId) });
}

// DELETE /api-backend/reactions/:id  (público)
export async function deleteReaction(req, res) {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID inválido' });

  const [reaction] = await db.select({ id: reactions.id }).from(reactions).where(eq(reactions.id, id));
  if (!reaction) return res.status(404).json({ error: 'Reacción no encontrada' });

  await db.delete(reactions).where(eq(reactions.id, id));
  res.status(204).send();
}
