import mongoose from 'mongoose';
import { Comment } from '../models/comment.model.js';
import { CommentReaction } from '../models/commentReaction.model.js';
import { Post } from '../models/post.model.js';
import { User } from '../models/user.model.js';
import { attachReactionCounts } from './commentReaction.controller.js';

const validId = (value) => mongoose.isValidObjectId(value);

// GET /api-backend/posts/:postId/comments  (público)
// author: null → el comentario es anónimo (sin iniciar sesión)
export async function listComments(req, res) {
  const { postId } = req.params;
  if (!validId(postId)) return res.status(400).json({ error: 'ID de post inválido' });

  if (!(await Post.exists({ _id: postId }))) {
    return res.status(404).json({ error: 'Post no encontrado' });
  }

  const comments = await Comment.find({ post: postId })
    .sort({ createdAt: -1 })
    .populate('author', 'name');
  res.json({ comments: await attachReactionCounts(comments) });
}

// POST /api-backend/posts/:postId/comments  (público)
// Body: { "content": "Mi comentario", "userId": "<id>" }   ← userId es opcional.
// Sin userId el comentario queda anónimo (author: null).
export async function createComment(req, res) {
  const { postId } = req.params;
  if (!validId(postId)) return res.status(400).json({ error: 'ID de post inválido' });

  if (!(await Post.exists({ _id: postId }))) {
    return res.status(404).json({ error: 'Post no encontrado' });
  }

  const { content, userId } = req.body;

  if (userId != null && !(await User.exists({ _id: userId }))) {
    return res.status(400).json({ error: 'El userId no corresponde a un usuario existente' });
  }

  const comment = await Comment.create({
    post: postId,
    content,
    author: userId ?? null,
  });
  await comment.populate('author', 'name');

  res.status(201).json({ comment });
}

// DELETE /api-backend/comments/:id  (público)
export async function deleteComment(req, res) {
  const { id } = req.params;
  if (!validId(id)) return res.status(400).json({ error: 'ID inválido' });

  const comment = await Comment.findById(id);
  if (!comment) return res.status(404).json({ error: 'Comentario no encontrado' });

  await comment.deleteOne();

  // MongoDB no tiene ON DELETE CASCADE: borrar las reacciones del comentario
  await CommentReaction.deleteMany({ comment: id });

  res.status(204).send();
}
