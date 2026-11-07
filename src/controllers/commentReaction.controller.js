import mongoose from 'mongoose';
import { Comment } from '../models/comment.model.js';
import { CommentReaction } from '../models/commentReaction.model.js';
import { User } from '../models/user.model.js';

const validId = (value) => mongoose.isValidObjectId(value);

// Agrega a cada comentario el conteo de reacciones por tipo:
// attachReactionCounts([comment]) → comments con campo `reactions: {like: 2}`
// Se usa en listComments y en el detalle del post (getPost).
export async function attachReactionCounts(comments) {
  const rows = await CommentReaction.aggregate([
    { $match: { comment: { $in: comments.map((c) => c._id) } } },
    { $group: { _id: { comment: '$comment', type: '$type' }, total: { $sum: 1 } } },
  ]);

  const map = new Map(); // commentId → { tipo: total }
  for (const { _id, total } of rows) {
    const key = _id.comment.toString();
    map.set(key, { ...map.get(key), [_id.type]: total });
  }

  return comments.map((comment) => ({
    ...comment.toJSON(),
    reactions: map.get(comment.id) ?? {},
  }));
}

// Agrupa las reacciones de UN comentario por tipo.
// countReactions('<id>') → { like: 3, sad: 1 }
async function countReactions(commentId) {
  const rows = await CommentReaction.aggregate([
    { $match: { comment: new mongoose.Types.ObjectId(commentId) } },
    { $group: { _id: '$type', total: { $sum: 1 } } },
  ]);

  const counts = {};
  for (const row of rows) counts[row._id] = row.total;
  return counts;
}

// GET /api-backend/comments/:commentId/reactions  (público)
// Devuelve el conteo por tipo + el detalle de cada reacción.
// user: null → la reacción es anónima (sin iniciar sesión).
export async function listCommentReactions(req, res) {
  const { commentId } = req.params;
  if (!validId(commentId)) return res.status(400).json({ error: 'ID de comentario inválido' });

  if (!(await Comment.exists({ _id: commentId }))) {
    return res.status(404).json({ error: 'Comentario no encontrado' });
  }

  const reactions = await CommentReaction.find({ comment: commentId })
    .sort({ createdAt: -1 })
    .populate('user', 'name');

  res.json({ counts: await countReactions(commentId), reactions });
}

// POST /api-backend/comments/:commentId/reactions  (público)
// Body: { "type": "like", "userId": "<id>" }   ← userId es opcional.
// Sin userId la reacción queda anónima.
export async function createCommentReaction(req, res) {
  const { commentId } = req.params;
  if (!validId(commentId)) return res.status(400).json({ error: 'ID de comentario inválido' });

  if (!(await Comment.exists({ _id: commentId }))) {
    return res.status(404).json({ error: 'Comentario no encontrado' });
  }

  const { type, userId } = req.body;

  if (userId != null) {
    if (!(await User.exists({ _id: userId }))) {
      return res.status(400).json({ error: 'El userId no corresponde a un usuario existente' });
    }

    // Un usuario registrado no puede repetir el MISMO tipo en el MISMO
    // comentario (pero sí puede usar tipos distintos, ej. like + sad).
    if (await CommentReaction.exists({ comment: commentId, user: userId, type })) {
      return res.status(409).json({ error: 'Ya reaccionaste a este comentario con este tipo' });
    }
  }

  const reaction = await CommentReaction.create({
    comment: commentId,
    type,
    user: userId ?? null,
  });
  await reaction.populate('user', 'name');

  // Devolvemos el conteo actualizado para que el frontend
  // no tenga que hacer otra petición.
  res.status(201).json({ reaction, counts: await countReactions(commentId) });
}

// DELETE /api-backend/comment-reactions/:id  (público)
export async function deleteCommentReaction(req, res) {
  const { id } = req.params;
  if (!validId(id)) return res.status(400).json({ error: 'ID inválido' });

  const reaction = await CommentReaction.findById(id);
  if (!reaction) return res.status(404).json({ error: 'Reacción no encontrada' });

  await reaction.deleteOne();
  res.status(204).send();
}
