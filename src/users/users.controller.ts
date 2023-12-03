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
  Query,
  ServiceUnavailableException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  Helpers,
  newPaginatorViewType,
  queryDataType,
} from '../helpers/helpers';
import { getUserViewModel, UserInputType } from './user.types';
import { UsersQueryRepository } from './usersQuery.repository';
import { ParseObjectIdPipe } from '../pipes/ParseObjectIdPipe';
import { Types } from 'mongoose';

@Injectable()
@Controller('users')
export class UsersController {
  constructor(
    public userService: UsersService,
    public usersQueryRepository: UsersQueryRepository,
    public helpers: Helpers,
  ) {}
  @Get()
  async getUsers(@Query() query: any) {
    try {
      const queryData: queryDataType = this.helpers.getDataFromQuery(query);
      console.log(queryData);
      const allUsers: newPaginatorViewType<getUserViewModel> =
        await this.usersQueryRepository.getAllUsers(queryData);
      return allUsers;
    } catch (e) {
      console.log(e);
      throw new ServiceUnavailableException();
    }
  }

  @Get(':userId')
  async getUserById(
    @Param('userId', new ParseObjectIdPipe()) userId: Types.ObjectId,
  ) {
    const isExistUser = await this.usersQueryRepository.findUserById(
      userId.toString(),
    );
    if (!isExistUser) {
      throw new NotFoundException();
    }
    try {
      const user: getUserViewModel | null =
        await this.usersQueryRepository.findUserById(userId.toString());
      return user;
    } catch (e) {
      console.log(e);
      throw new ServiceUnavailableException();
    }
  }

  @Delete(':userId')
  @HttpCode(204)
  async deleteUserById(
    @Param('userId', new ParseObjectIdPipe()) userId: Types.ObjectId,
  ) {
    const isExistUser = await this.usersQueryRepository.findUserById(
      userId.toString(),
    );
    if (!isExistUser) {
      throw new NotFoundException();
    }
    const isDeleted: boolean = await this.userService.deleteUser(
      userId.toString(),
    );
    if (isDeleted) {
      return true;
    } else throw new NotFoundException();
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
