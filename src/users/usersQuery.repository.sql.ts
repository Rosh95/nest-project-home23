import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { queryDataType } from '../helpers/helpers';
import {
  getUserViewModel,
  NewUsersDBType,
  NewUsersDBTypeSQL,
} from './user.types';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './user.schema';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class UsersQuerySqlRepository {
  constructor(
    @InjectModel(User.name) public userModel: Model<User>,
    @InjectDataSource() protected dataSource: DataSource,
  ) {}
  async getAllUsers(queryData: queryDataType) {
    const searchEmailTerm = queryData.searchEmailTerm;
    const searchLoginTerm = queryData.searchLoginTerm;
    //  const sortBy = 'createdAt'; // safe
    const sortBy = ['id', 'login', 'email', 'createdAt'].includes(
      queryData.sortBy,
    )
      ? queryData.sortBy
      : 'createdAt';
    const sortDirection = queryData.sortDirection === 1 ? 'desc' : 'asc';
    const query = `
    SELECT id, login, email, "createdAt"  
    FROM public."Users" u 
    WHERE login LIKE $1 AND  email LIKE $2
    ORDER BY "${sortBy}" ${sortDirection}
    `;
    const userData: getUserViewModel[] = await this.dataSource.query(query, [
      `%${searchLoginTerm}%`,
      `%${searchEmailTerm}%`,
    ]);
    const usersViewArray = userData.map((user) =>
      this.getUsersSqlMapping(user),
    );
    const pagesCount = await this.countTotalUsersAndPages(queryData);
    return {
      pagesCount: pagesCount.usersPagesCount,
      page: queryData.pageNumber,
      pageSize: queryData.pageSize,
      totalCount: pagesCount.usersTotalCount,
      items: usersViewArray,
    };
  }
  private getUsersSqlMapping(user: any): getUserViewModel {
    return {
      id: user.id,
      login: user.login,
      email: user.email,
      createdAt: user.createdAt.toString(),
    };
  }
  private async countTotalUsersAndPages(queryData: queryDataType) {
    const usersTotalCount = await this.getAllUsersCount(queryData);
    const usersPagesCount = Math.ceil(usersTotalCount / queryData.pageSize);

    return {
      usersTotalCount,
      usersPagesCount,
    };
  }

  async findUserById(userId: string): Promise<getUserViewModel | null> {
    const query = `
    SELECT id, login, email, "passwordHash", "passwordSalt", "createdAt"
    FROM public."Users" u 
    WHERE id = $1 
    `;
    const userData: NewUsersDBTypeSQL = await this.dataSource.query(query, [
      userId,
    ]);

    return userData[0] ? this.getUsersSqlMapping(userData[0]) : null;
  }

  private getUsersMapping(user: NewUsersDBType): getUserViewModel {
    return {
      id: user._id.toString(),
      login: user.accountData.login,
      email: user.accountData.email,
      createdAt: user.accountData.createdAt.toISOString(),
    };
  }
  async getAllUsersCount(queryData: queryDataType): Promise<number> {
    const query = `
    SELECT COUNT(*) FROM
    (SELECT id, login, email, "createdAt"  
    FROM public."Users" u 
    WHERE login LIKE $1 AND  email LIKE $2
    )
    `;
    const userData = await this.dataSource.query(query, [
      `%${queryData.searchLoginTerm}%`,
      `%${queryData.searchEmailTerm}%`,
    ]);
    return userData[0].count;
  }
}
