import { Router } from 'express';
import {
  createPost,
  deletePost,
  getPost,
  listPosts,
  updatePost,
} from '../controllers/post.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createPostSchema, updatePostSchema } from '../validations/post.validation.js';

export const postRouter = Router();

// Lectura pública, escritura protegida
postRouter.get('/', listPosts);
postRouter.get('/:id', getPost);
postRouter.post('/', requireAuth, validate(createPostSchema), createPost);
postRouter.put('/:id', requireAuth, validate(updatePostSchema), updatePost);
postRouter.delete('/:id', requireAuth, deletePost);
