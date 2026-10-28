import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { posts, users } from '../db/schema.js';

// Consulta base: posts con los datos públicos de su autor (JOIN).
const postWithAuthor = () =>
  db
    .select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      createdAt: posts.createdAt,
      author: { id: users.id, name: users.name },
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id));

const parseId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

// GET /api/posts  (público)
export async function listPosts(req, res) {
  const result = await postWithAuthor();
  res.json({ posts: result });
}

// GET /api/posts/:id  (público)
export async function getPost(req, res) {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID inválido' });

  const [post] = await postWithAuthor().where(eq(posts.id, id));
  if (!post) return res.status(404).json({ error: 'Post no encontrado' });

  res.json({ post });
}

// POST /api/posts  (requiere token)
export async function createPost(req, res) {
  const { title, content } = req.body;

  const [post] = await db
    .insert(posts)
    .values({ title, content, authorId: req.user.sub })
    .returning();

  res.status(201).json({ post });
}

// PUT /api/posts/:id  (requiere token, solo el autor)
export async function updatePost(req, res) {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID inválido' });

  const [post] = await db.select().from(posts).where(eq(posts.id, id));
  if (!post) return res.status(404).json({ error: 'Post no encontrado' });

  if (post.authorId !== req.user.sub) {
    return res.status(403).json({ error: 'Solo el autor puede editar este post' });
  }

  const [updated] = await db
    .update(posts)
    .set(req.body)
    .where(eq(posts.id, id))
    .returning();

  res.json({ post: updated });
}

// DELETE /api/posts/:id  (requiere token, solo el autor)
export async function deletePost(req, res) {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID inválido' });

  const [post] = await db.select().from(posts).where(eq(posts.id, id));
  if (!post) return res.status(404).json({ error: 'Post no encontrado' });

  if (post.authorId !== req.user.sub) {
    return res.status(403).json({ error: 'Solo el autor puede eliminar este post' });
  }

  await db.delete(posts).where(eq(posts.id, id));
  res.status(204).send();
}
