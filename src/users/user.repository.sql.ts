import { Injectable } from '@nestjs/common';
import {
  emailConfirmationType,
  getUserViewModel,
  NewUsersDBType,
  NewUsersDBTypeSQL,
} from './user.types';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './user.schema';
import { Model } from 'mongoose';
import add from 'date-fns/add';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { emailConfirmationDataType } from '../auth/auth.types';

@Injectable()
export class UserSqlRepository {
  constructor(
    @InjectModel(User.name) public userModel: Model<UserDocument>,
    @InjectDataSource() protected dataSource: DataSource,
  ) {}

  async getAllUsers() {
    return this.userModel.find().sort({ createdAt: -1 }).lean();
  }

  async createUser(newUser: any): Promise<string | null> {
    const query = `
INSERT INTO public."Users"(
 login, email, "passwordHash", "passwordSalt")
VALUES ( $1, $2, $3, $4);
    `;
    await this.dataSource.query(query, [
      newUser.login,
      newUser.email,
      newUser.passwordHash,
      newUser.passwordSalt,
    ]);

    const queryDataForNewPost = `
    SELECT *   FROM public."Users" u 
    WHERE login = $1 
    `;
    const userData = await this.dataSource.query(queryDataForNewPost, [
      newUser.login,
    ]);
    if (userData[0]) {
      return userData[0].id;
    }
    return null;
  }

  async deleteUser(id: string): Promise<boolean> {
    const query = `
    DELETE FROM public."Users"
    WHERE id = $1 
    `;
    const userData = await this.dataSource.query(query, [id]);
    return userData[1] === 1;
  }

  async findUserById(userId: string): Promise<getUserViewModel | null> {
    const query = `
    SELECT *   FROM public."Users" u 
    WHERE "id" = $1 
    `;
    const userData: NewUsersDBTypeSQL = await this.dataSource.query(query, [
      userId,
    ]);
    return userData[0] ? userData[0] : null;
  }

  // async findUserByLogin(login: string): Promise<NewUsersDBType | null> {
  //   const foundUser = await this.userModel.findOne({
  //     'accountData.login': login,
  //   });
  //   if (foundUser) {
  //     return foundUser;
  //   } else {
  //     return null;
  //   }
  // }

  async findUserByEmail(email: string): Promise<NewUsersDBType | null> {
    const query = `
    SELECT id, login, email, "createdAt", "passwordSalt" , "passwordHash"
    FROM public."Users" u 
    WHERE email = $1
    `;

    const userData = await this.dataSource.query(query, [`${email}`]);

    return userData[0] ? userData[0] : null;

    // const foundUser = await this.userModel.findOne({
    //   'accountData.email': email,
    // });
    // if (foundUser) {
    //   return foundUser;
    // } else {
    //   return null;
    // }
  }

  async findUserByCode(
    code: string,
  ): Promise<emailConfirmationDataType | null> {
    const query = `
    SELECT "userId", "confirmationCode", "emailExpiration", "isConfirmed"
    FROM public."EmailConfirmationUser"
    where "confirmationCode" =  $1
    `;

    const userEmailConfirmationData = await this.dataSource.query(query, [
      code,
    ]);

    return userEmailConfirmationData[0] ? userEmailConfirmationData[0] : null;

    // const foundUser = await this.userModel.findOne({
    //   'emailConfirmation.confirmationCode': code,
    // });
    // if (foundUser) {
    //   return foundUser;
    // } else {
    //   return null;
    // }
  }

  async findUserByLoginOrEmail(loginOrEmail: string): Promise<any | null> {
    const query = `
    SELECT id, login, email, "createdAt", "passwordSalt" , "passwordHash"
    FROM public."Users" u 
    WHERE login = $1 OR  email = $2
    `;

    const userData = await this.dataSource.query(query, [
      `${loginOrEmail}`,
      `${loginOrEmail}`,
    ]);

    return userData[0] ? userData[0] : null;
  }
  async findFullInfoUserAndEmailInfo(
    loginOrEmail: string,
  ): Promise<any | null> {
    const query = `
    SELECT id, login, email, "createdAt", "passwordSalt" , "passwordHash", ec."confirmationCode", ec."emailExpiration", ec."isConfirmed"
    FROM public."Users" u 
    LEFT JOIN public."EmailConfirmationUser" as ec ON ec."userId" = u.id
    WHERE login = $1 OR  email = $2
    `;

    const userData = await this.dataSource.query(query, [
      `${loginOrEmail}`,
      `${loginOrEmail}`,
    ]);

    return userData[0] ? userData[0] : null;
  }
  async sendEmailConfirmation(
    emailConfirmationInfo: emailConfirmationType,
  ): Promise<any | null> {
    const query = `
      INSERT INTO public."EmailConfirmationUser"(
      "userId", "confirmationCode", "emailExpiration", "isConfirmed")
      VALUES ($1, $2, $3, $4);
    `;

    await this.dataSource.query(query, [
      `${emailConfirmationInfo.userId}`,
      `${emailConfirmationInfo.confirmationCode}`,
      `${emailConfirmationInfo.emailExpiration}`,
      `${emailConfirmationInfo.isConfirmed}`,
    ]);
    const getEmailConfirmation = await this.dataSource.query(
      `
          SELECT *  FROM public."EmailConfirmationUser"
          WHERE "userId" = $1
    `,
      [emailConfirmationInfo.userId],
    );

    return getEmailConfirmation[0] ? getEmailConfirmation[0] : null;
  }

  async updateConfirmationCode(userId: string, code: string): Promise<boolean> {
    const emailConfirmation = add(new Date(), {
      hours: 2,
      minutes: 3,
    }).toISOString();
    await this.dataSource.query(
      `
    UPDATE public."EmailConfirmationUser"
    SET "confirmationCode" = $1, "emailExpiration" = $2
    WHERE "userId" = $3 ;
    `,
      [code, emailConfirmation, userId],
    );

    // await this.userModel.findByIdAndUpdate(
    //   userId,
    //   {
    //     $set: {
    //       'emailConfirmation.confirmationCode': code,
    //       'emailConfirmation.emailExpiration': add(new Date(), {
    //         hours: 2,
    //         minutes: 3,
    //       }),
    //     },
    //   },
    //   { new: true },
    // );

    return true;
  }

  private getUsersSqlMapping(user: any): getUserViewModel {
    return {
      id: user.id,
      login: user.login,
      email: user.email,
      createdAt: user.createdAt.toString(),
    };
  }

  private getUsersMapping(user: NewUsersDBType): getUserViewModel {
    return {
      id: user._id.toString(),
      login: user.accountData.login,
      email: user.accountData.email,
      createdAt: user.accountData.createdAt.toISOString(),
    };
  }
}
