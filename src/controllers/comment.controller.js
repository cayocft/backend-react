import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { comments, posts, users } from '../db/schema.js';

const parseId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

// Consulta base: comentarios con los datos públicos de su autor (JOIN).
const commentWithAuthor = () =>
  db
    .select({
      id: comments.id,
      content: comments.content,
      createdAt: comments.createdAt,
      author: { id: users.id, name: users.name },
    })
    .from(comments)
    .leftJoin(users, eq(comments.userId, users.id));

// author: null → el comentario es anónimo (sin iniciar sesión)
const withAnonymousAuthor = ({ author, ...comment }) => ({
  ...comment,
  author: author?.id ? author : null,
});

// GET /api-backend/posts/:postId/comments  (público)
export async function listComments(req, res) {
  const postId = parseId(req.params.postId);
  if (!postId) return res.status(400).json({ error: 'ID de post inválido' });

  const [post] = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, postId));
  if (!post) return res.status(404).json({ error: 'Post no encontrado' });

  const list = await commentWithAuthor().where(eq(comments.postId, postId));
  res.json({ comments: list.map(withAnonymousAuthor) });
}

// POST /api-backend/posts/:postId/comments  (público)
// Body: { "content": "Mi comentario", "userId": 1 }   ← userId es opcional.
// Sin userId el comentario queda anónimo (author: null).
export async function createComment(req, res) {
  const postId = parseId(req.params.postId);
  if (!postId) return res.status(400).json({ error: 'ID de post inválido' });

  const [post] = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, postId));
  if (!post) return res.status(404).json({ error: 'Post no encontrado' });

  const { content, userId } = req.body;

  if (userId != null) {
    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId));
    if (!user) {
      return res.status(400).json({ error: 'El userId no corresponde a un usuario existente' });
    }
  }

  const [comment] = await db
    .insert(comments)
    .values({ postId, content, userId: userId ?? null })
    .returning();

  // Volvemos a leerlo con el JOIN para devolverlo con su author
  // (o author: null si es anónimo), igual que en el listado.
  const [created] = await commentWithAuthor().where(eq(comments.id, comment.id));
  res.status(201).json({ comment: withAnonymousAuthor(created) });
}

// DELETE /api-backend/comments/:id  (público)
export async function deleteComment(req, res) {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID inválido' });

  const [comment] = await db.select({ id: comments.id }).from(comments).where(eq(comments.id, id));
  if (!comment) return res.status(404).json({ error: 'Comentario no encontrado' });

  await db.delete(comments).where(eq(comments.id, id));
  res.status(204).send();
}
