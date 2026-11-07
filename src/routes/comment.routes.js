import { Router } from 'express';
import { deleteComment } from '../controllers/comment.controller.js';

// Solo el DELETE vive aquí. Los GET/POST de comentarios van anidados
// bajo /posts/:postId/comments (ver post.routes.js) porque un
// comentario siempre pertenece a un post.
export const commentRouter = Router();

commentRouter.delete('/:id', deleteComment);
