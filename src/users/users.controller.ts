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
import { newPaginatorViewType, queryDataType } from '../helpers/helpers';
import { CreateUserDto, getUserViewModel } from './user.types';
import { UsersQueryRepository } from './usersQuery.repository';
import { ParseObjectIdPipe } from '../pipes/ParseObjectIdPipe';
import { Types } from 'mongoose';
import { BasicAuthGuard } from '../auth/guards/basic-auth.guard';
import { QueryData } from '../helpers/decorators/helpers.decorator.queryData';
import { mappingErrorStatus, ResultObject } from '../helpers/heplersType';
import { CommandBus } from '@nestjs/cqrs';
import { CreateUserCommand } from './application/use-cases/CreateUser';
import { DeleteUserCommand } from './application/use-cases/DeleteUser';
import { SkipThrottle } from '@nestjs/throttler';

@Injectable()
@SkipThrottle()
@Controller('users')
export class UsersController {
  constructor(
    public usersQueryRepository: UsersQueryRepository,
    private commandBus: CommandBus,
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
    const result = await this.commandBus.execute(
      new DeleteUserCommand(userId.toString()),
    );
    if (result.data == null) {
      return mappingErrorStatus(result);
    }
    return true;
  }

  @UseGuards(BasicAuthGuard)
  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    const newUser: ResultObject<string> = await this.commandBus.execute(
      new CreateUserCommand(createUserDto),
    );
    if (newUser.data === null) {
      return mappingErrorStatus(newUser);
    }
    const newUserInfo = await this.usersQueryRepository.findUserById(
      newUser.data,
    );
    return newUserInfo;
  }
}
