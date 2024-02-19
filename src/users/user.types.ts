import { ObjectId } from 'mongodb';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { UserSqlRepository } from './user.repository.sql';

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
  ё;
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

export type emailConfirmationType = {
  userId: string;
  confirmationCode: string;
  emailExpiration: string;
  isConfirmed: boolean;
};

export type NewUsersDBTypeSQL = {
  _id: ObjectId;
  login: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: Date;
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

// export type UserInputType = {
//   login: string;
//   password: string;
//   email: string;
// };
@ValidatorConstraint({ name: 'EmailExists', async: true })
@Injectable()
export class EmailExistsRule implements ValidatorConstraintInterface {
  constructor(private userRepository: UserSqlRepository) {}

  async validate(value: string) {
    const result = await this.userRepository.findUserByLoginOrEmail(value);
    return !result;
  }

  defaultMessage() {
    return 'Email  exist';
  }
}
@ValidatorConstraint({ name: 'LoginExists', async: true })
@Injectable()
export class LoginExistsRule implements ValidatorConstraintInterface {
  constructor(private userRepository: UserSqlRepository) {}

  async validate(value: string) {
    const result = await this.userRepository.findUserByLoginOrEmail(value);
    return !result;
  }

  defaultMessage() {
    return 'Login  exist';
  }
}
export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @Length(3, 10)
  @Validate(LoginExistsRule)
  @Matches('^[a-zA-Z0-9_-]*$')
  login: string;

  @IsNotEmpty()
  @IsString()
  @Length(6, 20)
  password: string;

  @IsNotEmpty()
  @IsString()
  @IsEmail()
  @Validate(EmailExistsRule)
  // @Matches('^[w-.]+@([w-]+.)+[w-]{2,4}$')
  @IsEmail()
  email: string;
}
