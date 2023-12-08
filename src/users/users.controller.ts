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
    const isExistUser = await this.usersQueryRepository.findUserById(
      userId.toString(),
    );
    if (!isExistUser) throw new NotFoundException();

    const user: getUserViewModel | null =
      await this.usersQueryRepository.findUserById(userId.toString());
    return user;
  }

  @UseGuards(BasicAuthGuard)
  @Delete(':userId')
  @HttpCode(204)
  async deleteUserById(
    @Param('userId', new ParseObjectIdPipe()) userId: Types.ObjectId,
  ) {
    const isExistUser = await this.usersQueryRepository.findUserById(
      userId.toString(),
    );
    if (!isExistUser) throw new NotFoundException();

    return await this.userService.deleteUser(userId.toString());
  }

  @UseGuards(BasicAuthGuard)
  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    const newUser: getUserViewModel | null =
      await this.userService.createUser(createUserDto);
    return newUser;
  }
}
