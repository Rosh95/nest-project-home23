import { ObjectId } from 'mongodb';

export type UserViewModel = {
  id: string;
  login: string;
  email: string;
  createdAt: string;
  emailConfirmation: {
    confirmationCode: string;
    emailExpiration: Date;
    isConfirmed: boolean;
  };
};
export type getUserViewModel = {
  id: string;
  login: string;
  email: string;
  createdAt: string;
};
export type UserInputType = {
  login: string;
  password: string;
  email: string;
};
export type CurrentUserInfoType = {
  login: string;
  email: string;
  userId: string;
};
export type UsersDBType = {
  _id: ObjectId;
  login: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: Date;
};
export type NewUsersDBType = {
  _id: ObjectId;
  accountData: {
    login: string;
    email: string;
    passwordHash: string;
    passwordSalt: string;
    createdAt: Date;
  };
  emailConfirmation: {
    confirmationCode: string;
    emailExpiration: Date;
    isConfirmed: boolean;
  };
};

export type PaginatorUserViewType = {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: getUserViewModel[];
};

// export const UsersSchema = new mongoose.Schema<NewUsersDBType>({
//   accountData: {
//     login: String,
//     email: String,
//     passwordHash: String,
//     passwordSalt: String,
//     createdAt: { type: Date, default: Date.now() },
//   },
//   emailConfirmation: {
//     confirmationCode: String,
//     emailExpiration: Date,
//     isConfirmed: { type: Boolean, default: false },
//   },
// });
