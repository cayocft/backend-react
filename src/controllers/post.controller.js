import mongoose from 'mongoose';
import { Comment } from '../models/comment.model.js';
import { CommentReaction } from '../models/commentReaction.model.js';
import { Post } from '../models/post.model.js';
import { Reaction } from '../models/reaction.model.js';
import { attachReactionCounts } from './commentReaction.controller.js';

const validId = (value) => mongoose.isValidObjectId(value);

// Agrega a cada post el conteo de reacciones por tipo
// (reactions: { like: 3 }) y el total de comentarios (commentsCount).
// Equivale al GROUP BY de SQL usando aggregation pipelines de Mongo.
async function withCounts(postList) {
  const [reactionRows, commentRows] = await Promise.all([
    Reaction.aggregate([
      { $group: { _id: { post: '$post', type: '$type' }, total: { $sum: 1 } } },
    ]),
    Comment.aggregate([{ $group: { _id: '$post', total: { $sum: 1 } } }]),
  ]);

  // postId (string) → { tipo: total }
  const reactionMap = new Map();
  for (const { _id, total } of reactionRows) {
    const key = _id.post.toString();
    reactionMap.set(key, { ...reactionMap.get(key), [_id.type]: total });
  }
  // postId (string) → total
  const commentMap = new Map(commentRows.map((r) => [r._id.toString(), r.total]));

  return postList.map((post) => {
    const p = post.toJSON();
    return {
      ...p,
      reactions: reactionMap.get(p.id) ?? {},
      commentsCount: commentMap.get(p.id) ?? 0,
    };
  });
}

// GET /api-backend/posts  (público, más recientes primero)
export async function listPosts(req, res) {
  const posts = await Post.find()
    .sort({ createdAt: -1 })
    .populate('author', 'name');
  res.json({ posts: await withCounts(posts) });
}

// GET /api-backend/posts/:id  (público)
// Devuelve el post completo: conteos (reactions, commentsCount) +
// el detalle de comentarios y reacciones, todo en una sola respuesta.
export async function getPost(req, res) {
  const { id } = req.params;
  if (!validId(id)) return res.status(400).json({ error: 'ID inválido' });

  const post = await Post.findById(id).populate('author', 'name');
  if (!post) return res.status(404).json({ error: 'Post no encontrado' });

  const [commentDocs, reactionsDetail] = await Promise.all([
    Comment.find({ post: id }).sort({ createdAt: -1 }).populate('author', 'name'),
    Reaction.find({ post: id }).sort({ createdAt: -1 }).populate('user', 'name'),
  ]);

  const [[postWithCounts], comments] = await Promise.all([
    withCounts([post]),
    attachReactionCounts(commentDocs),
  ]);

  res.json({ post: { ...postWithCounts, comments, reactionsDetail } });
}

// POST /api-backend/posts  (requiere token)
export async function createPost(req, res) {
  const { title, content } = req.body;

  const post = await Post.create({ title, content, author: req.user.sub });
  await post.populate('author', 'name');

  res.status(201).json({ post });
}

// PUT /api-backend/posts/:id  (requiere token, solo el autor)
export async function updatePost(req, res) {
  const { id } = req.params;
  if (!validId(id)) return res.status(400).json({ error: 'ID inválido' });

  const post = await Post.findById(id);
  if (!post) return res.status(404).json({ error: 'Post no encontrado' });

  // author es ObjectId: se compara como string con el sub del token
  if (post.author.toString() !== req.user.sub) {
    return res.status(403).json({ error: 'Solo el autor puede editar este post' });
  }

  const updated = await Post.findByIdAndUpdate(id, req.body, {
    returnDocument: 'after',
  }).populate('author', 'name');

  res.json({ post: updated });
}

// DELETE /api-backend/posts/:id  (requiere token, solo el autor)
export async function deletePost(req, res) {
  const { id } = req.params;
  if (!validId(id)) return res.status(400).json({ error: 'ID inválido' });

  const post = await Post.findById(id);
  if (!post) return res.status(404).json({ error: 'Post no encontrado' });

  if (post.author.toString() !== req.user.sub) {
    return res.status(403).json({ error: 'Solo el autor puede eliminar este post' });
  }

  await post.deleteOne();

  // MongoDB no tiene ON DELETE CASCADE: hay que borrar
  // manualmente lo que depende del post (incluidas las
  // reacciones de sus comentarios).
  const commentIds = await Comment.find({ post: id }).distinct('_id');
  await CommentReaction.deleteMany({ comment: { $in: commentIds } });
  await Comment.deleteMany({ post: id });
  await Reaction.deleteMany({ post: id });

  res.status(204).send();
}
