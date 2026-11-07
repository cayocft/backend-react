import { Router } from 'express';
import { createComment, listComments } from '../controllers/comment.controller.js';
import {
  createPost,
  deletePost,
  getPost,
  listPosts,
  updatePost,
} from '../controllers/post.controller.js';
import { createReaction, listReactions } from '../controllers/reaction.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createCommentSchema } from '../validations/comment.validation.js';
import { createPostSchema, updatePostSchema } from '../validations/post.validation.js';
import { createReactionSchema } from '../validations/reaction.validation.js';

export const postRouter = Router();

// Lectura pública, escritura protegida
postRouter.get('/', listPosts);
postRouter.get('/:id', getPost);
postRouter.post('/', requireAuth, validate(createPostSchema), createPost);
postRouter.put('/:id', requireAuth, validate(updatePostSchema), updatePost);
postRouter.delete('/:id', requireAuth, deletePost);

// Reacciones y comentarios: TODO público por ahora (sin token).
// Quien no envíe userId en el body queda registrado como anónimo.
postRouter.get('/:postId/reactions', listReactions);
postRouter.post('/:postId/reactions', validate(createReactionSchema), createReaction);
postRouter.get('/:postId/comments', listComments);
postRouter.post('/:postId/comments', validate(createCommentSchema), createComment);
