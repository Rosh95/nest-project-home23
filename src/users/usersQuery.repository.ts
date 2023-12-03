import { FilterQuery, Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { queryDataType } from '../helpers/helpers';
import {
  getUserViewModel,
  NewUsersDBType,
  PaginatorUserViewType,
} from './user.types';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './user.schema';
import { ObjectId } from 'mongodb';

@Injectable()
export class UsersQueryRepository {
  constructor(@InjectModel(User.name) public userModel: Model<User>) {}
  async getAllUsers(queryData: queryDataType): Promise<PaginatorUserViewType> {
    const filter: FilterQuery<NewUsersDBType> = {
      $or: [
        {
          'accountData.email': {
            $regex: queryData.searchEmailTerm ?? '',
            $options: 'i',
          },
        },
        {
          'accountData.login': {
            $regex: queryData.searchLoginTerm ?? '',
            $options: 'i',
          },
        },
      ],
    };

    const users = await this.userModel
      .find(filter)
      .sort({ 'accountData.createdAt': queryData.sortDirection })
      .skip(queryData.skippedPages)
      .limit(queryData.pageSize)
      .lean();
    console.log(users);
    console.log(queryData);
    const usersViewArray: getUserViewModel[] = users.map((user) =>
      this.getUsersMapping(user),
    );
    const pagesCount = await this.countTotalUsersAndPages(queryData, filter);

    return {
      pagesCount: pagesCount.usersPagesCount,
      page: queryData.pageNumber,
      pageSize: queryData.pageSize,
      totalCount: pagesCount.usersTotalCount,
      items: usersViewArray,
    };
  }

  private async countTotalUsersAndPages(
    queryData: queryDataType,
    filter?: any,
  ) {
    const usersTotalCount = await this.getAllUsersCount(filter);
    const usersPagesCount = Math.ceil(usersTotalCount / queryData.pageSize);

    return {
      usersTotalCount,
      usersPagesCount,
    };
  }

  async findUserById(userId: string): Promise<getUserViewModel | null> {
    const foundUser: NewUsersDBType | null = await this.userModel.findOne({
      _id: new ObjectId(userId),
    });
    return foundUser ? this.getUsersMapping(foundUser) : null;
  }

  private getUsersMapping(user: NewUsersDBType): getUserViewModel {
    return {
      id: user._id.toString(),
      login: user.accountData.login,
      email: user.accountData.email,
      createdAt: user.accountData.createdAt.toISOString(),
    };
  }
  async getAllUsersCount(filter?: FilterQuery<any>): Promise<number> {
    return filter
      ? this.userModel.countDocuments(filter)
      : this.userModel.countDocuments();
  }
}
