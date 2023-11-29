import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Injectable,
  NotFoundException,
  Param,
  Post,
  Req,
  ServiceUnavailableException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Request } from 'express';
import { Helpers, queryDataType } from '../helpers/helpers';
import {
  getUserViewModel,
  PaginatorUserViewType,
  UserInputType,
} from './user.types';
import { UsersQueryRepository } from './usersQuery.repository';

@Injectable()
@Controller('users')
export class UsersController {
  constructor(
    public userService: UsersService,
    public usersQueryRepository: UsersQueryRepository,
    public helpers: Helpers,
  ) {}
  @Get()
  async getUsers(@Req() req: Request) {
    try {
      const queryData: queryDataType = await this.helpers.getDataFromQuery(
        req.query,
      );
      const allUsers: PaginatorUserViewType =
        await this.usersQueryRepository.getAllUsers(queryData);
      return allUsers;
    } catch (e) {
      console.log(e);
      throw new ServiceUnavailableException();
    }
  }

  @Get(':userId')
  async getUserById(@Param('userId') userId: string) {
    const isExistUser = await this.usersQueryRepository.findUserById(userId);
    if (!isExistUser) {
      return false;
    }
    try {
      const user: getUserViewModel | null =
        await this.usersQueryRepository.findUserById(userId);
      return user;
    } catch (e) {
      console.log(e);
      throw new ServiceUnavailableException();
    }
  }

  @Delete(':userId')
  @HttpCode(204)
  async deleteUserById(@Param('userId') userId: string) {
    try {
      const isDeleted: boolean = await this.userService.deleteUser(userId);
      if (isDeleted) {
        return true;
      } else throw new NotFoundException();
    } catch (e) {
      console.log(e);
      throw new ServiceUnavailableException();
    }
  }

  @Post()
  async createUser(
    @Body() body: { email: string; login: string; password: string },
  ) {
    const userPostInputData: UserInputType = {
      email: body.email,
      login: body.login,
      password: body.password,
    };
    const newUser: getUserViewModel | null =
      await this.userService.createUser(userPostInputData);
    // await userService.createUser(userPostInputData);
    return newUser;
  }
}
