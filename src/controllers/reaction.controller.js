import mongoose from 'mongoose';
import { Post } from '../models/post.model.js';
import { Reaction } from '../models/reaction.model.js';
import { User } from '../models/user.model.js';

const validId = (value) => mongoose.isValidObjectId(value);

// Agrupa las reacciones de UN post por tipo.
// countReactions('<id>') → { like: 3, sad: 1 }
async function countReactions(postId) {
  const rows = await Reaction.aggregate([
    { $match: { post: new mongoose.Types.ObjectId(postId) } },
    { $group: { _id: '$type', total: { $sum: 1 } } },
  ]);

  const counts = {};
  for (const row of rows) counts[row._id] = row.total;
  return counts;
}

// GET /api-backend/posts/:postId/reactions  (público)
// Devuelve el conteo por tipo + el detalle de cada reacción.
// user: null → la reacción es anónima (sin iniciar sesión).
export async function listReactions(req, res) {
  const { postId } = req.params;
  if (!validId(postId)) return res.status(400).json({ error: 'ID de post inválido' });

  if (!(await Post.exists({ _id: postId }))) {
    return res.status(404).json({ error: 'Post no encontrado' });
  }

  const reactions = await Reaction.find({ post: postId })
    .sort({ createdAt: -1 })
    .populate('user', 'name');

  res.json({ counts: await countReactions(postId), reactions });
}

// POST /api-backend/posts/:postId/reactions  (público)
// Body: { "type": "like", "userId": "<id>" }   ← userId es opcional.
// Sin userId la reacción queda anónima. El autor SÍ puede reaccionar
// a su propio post.
export async function createReaction(req, res) {
  const { postId } = req.params;
  if (!validId(postId)) return res.status(400).json({ error: 'ID de post inválido' });

  if (!(await Post.exists({ _id: postId }))) {
    return res.status(404).json({ error: 'Post no encontrado' });
  }

  const { type, userId } = req.body;

  if (userId != null) {
    if (!(await User.exists({ _id: userId }))) {
      return res.status(400).json({ error: 'El userId no corresponde a un usuario existente' });
    }

    // Un usuario registrado no puede repetir el MISMO tipo en el MISMO post
    // (pero sí puede usar tipos distintos, ej. like + sad).
    if (await Reaction.exists({ post: postId, user: userId, type })) {
      return res.status(409).json({ error: 'Ya reaccionaste a este post con este tipo' });
    }
  }

  const reaction = await Reaction.create({ post: postId, type, user: userId ?? null });
  await reaction.populate('user', 'name');

  // Devolvemos el conteo actualizado para que el frontend
  // no tenga que hacer otra petición.
  res.status(201).json({ reaction, counts: await countReactions(postId) });
}

// DELETE /api-backend/reactions/:id  (público)
export async function deleteReaction(req, res) {
  const { id } = req.params;
  if (!validId(id)) return res.status(400).json({ error: 'ID inválido' });

  const reaction = await Reaction.findById(id);
  if (!reaction) return res.status(404).json({ error: 'Reacción no encontrada' });

  await reaction.deleteOne();
  res.status(204).send();
}
