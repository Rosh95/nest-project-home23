import { NewUsersDBType } from '../users/user.types';

declare global {
  declare namespace Express {
    export interface Request {
      user: NewUsersDBType | null;
    }
  }
}
