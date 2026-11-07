import { Router } from 'express';
import { deleteComment } from '../controllers/comment.controller.js';
import {
  createCommentReaction,
  listCommentReactions,
} from '../controllers/commentReaction.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createReactionSchema } from '../validations/reaction.validation.js';

// El DELETE de comentarios y las reacciones a comentarios viven aquí.
// Las reacciones van anidadas bajo /comments/:commentId/reactions porque
// siempre pertenecen a un comentario (mismo patrón que /posts/:postId).
export const commentRouter = Router();

commentRouter.delete('/:id', deleteComment);
commentRouter.get('/:commentId/reactions', listCommentReactions);
commentRouter.post(
  '/:commentId/reactions',
  validate(createReactionSchema),
  createCommentReaction,
);
