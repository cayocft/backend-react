import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { commentReactionRouter } from './commentReaction.routes.js';
import { commentRouter } from './comment.routes.js';
import { postRouter } from './post.routes.js';
import { reactionRouter } from './reaction.routes.js';
import { userRouter } from './user.routes.js';

// Router raíz: agrupa todos los recursos de la API.
// Para agregar un recurso nuevo: crea su archivo de rutas
// y móntalo aquí con router.use('/nombre', suRouter).
export const router = Router();

router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/posts', postRouter);
router.use('/reactions', reactionRouter);
router.use('/comments', commentRouter);
router.use('/comment-reactions', commentReactionRouter);
