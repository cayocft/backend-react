import { Router } from 'express';
import { getUser, listUsers } from '../controllers/user.controller.js';

export const userRouter = Router();

userRouter.get('/', listUsers);
userRouter.get('/:id', getUser);
