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
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { newPaginatorViewType, queryDataType } from '../helpers/helpers';
import { CreateUserDto, getUserViewModel } from './user.types';
import { UsersQueryRepository } from './usersQuery.repository';
import { ParseObjectIdPipe } from '../pipes/ParseObjectIdPipe';
import { Types } from 'mongoose';
import { BasicAuthGuard } from '../auth/guards/basic-auth.guard';
import { QueryData } from '../helpers/decorators/helpers.decorator.queryData';
import { mappingErrorStatus, ResultObject } from '../helpers/heplersType';

@Injectable()
@Controller('users')
export class UsersController {
  constructor(
    public userService: UsersService,
    public usersQueryRepository: UsersQueryRepository,
  ) {}

  @UseGuards(BasicAuthGuard)
  @Get()
  async getUsers(@QueryData() queryData: queryDataType) {
    const allUsers: newPaginatorViewType<getUserViewModel> =
      await this.usersQueryRepository.getAllUsers(queryData);
    return allUsers;
  }

  @Get(':userId')
  async getUserById(
    @Param('userId', new ParseObjectIdPipe()) userId: Types.ObjectId,
  ) {
    const user: getUserViewModel | null =
      await this.usersQueryRepository.findUserById(userId.toString());
    if (user) {
      return user;
    }
    throw new NotFoundException();
  }

  @UseGuards(BasicAuthGuard)
  @Delete(':userId')
  @HttpCode(204)
  async deleteUserById(
    @Param('userId', new ParseObjectIdPipe()) userId: Types.ObjectId,
  ) {
    const result = await this.userService.deleteUser(userId.toString());
    if (result.data == null) {
      return mappingErrorStatus(result);
    }
    return true;
  }

  @UseGuards(BasicAuthGuard)
  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    const newUser: ResultObject<string> =
      await this.userService.createUser(createUserDto);
    if (newUser.data === null) {
      return mappingErrorStatus(newUser);
    }
    const newUserInfo = await this.usersQueryRepository.findUserById(
      newUser.data,
    );
    return newUserInfo;
  }
}
