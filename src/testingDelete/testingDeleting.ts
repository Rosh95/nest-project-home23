import { Request, Response, Router } from 'express';
import {
  BlogModel,
  CommentModel,
  DeviceModel,
  LoginAttemptModel,
  PostModel,
  UserModel,
} from '../db/dbMongo';

export const testRouter = Router({});

testRouter.delete('/', async (req: Request, res: Response) => {
  await BlogModel.deleteMany({});
  await PostModel.deleteMany({});
  await UserModel.deleteMany({});
  await CommentModel.deleteMany({});
  await DeviceModel.deleteMany({});
  await LoginAttemptModel.deleteMany({});
  res.sendStatus(204);
});
