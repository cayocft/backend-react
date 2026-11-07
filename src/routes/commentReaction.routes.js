import { Router } from 'express';
import { deleteCommentReaction } from '../controllers/commentReaction.controller.js';

// Solo el DELETE vive aquí. Los GET/POST de reacciones a comentarios
// van anidados bajo /comments/:commentId/reactions (ver comment.routes.js).
export const commentReactionRouter = Router();

commentReactionRouter.delete('/:id', deleteCommentReaction);
