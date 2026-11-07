import mongoose from 'mongoose';
import { Post } from '../models/post.model.js';
import { User } from '../models/user.model.js';

const validId = (value) => mongoose.isValidObjectId(value);

// GET /api-backend/users  (público, más recientes primero)
export async function listUsers(req, res) {
  const result = await User.find().sort({ createdAt: -1 });
  res.json({ users: result });
}

// GET /api-backend/users/:id  (público, incluye sus posts)
// En MongoDB no hay JOIN: se hacen dos consultas y se combinan,
// o se usa populate sobre la referencia inversa.
export async function getUser(req, res) {
  const { id } = req.params;
  if (!validId(id)) return res.status(400).json({ error: 'ID inválido' });

  const user = await User.findById(id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  const posts = await Post.find({ author: id })
    .sort({ createdAt: -1 })
    .select('title content createdAt');

  res.json({ user: { ...user.toJSON(), posts } });
}
