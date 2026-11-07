import { Router } from 'express';
import { deleteReaction } from '../controllers/reaction.controller.js';

// Solo el DELETE vive aquí. Los GET/POST de reacciones van anidados
// bajo /posts/:postId/reactions (ver post.routes.js) porque una
// reacción siempre pertenece a un post.
export const reactionRouter = Router();

reactionRouter.delete('/:id', deleteReaction);
