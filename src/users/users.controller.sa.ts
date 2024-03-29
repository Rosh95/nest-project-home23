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
import { BasicAuthGuard } from '../auth/guards/basic-auth.guard';
import { QueryData } from '../helpers/decorators/helpers.decorator.queryData';
import { mappingErrorStatus, ResultObject } from '../helpers/heplersType';
import { CommandBus } from '@nestjs/cqrs';
import { CreateUserCommand } from './application/use-cases/CreateUser';
import { DeleteUserCommand } from './application/use-cases/DeleteUser';
import { UsersQuerySqlRepository } from './usersQuery.repository.sql';
import { ParseStringPipe } from '../pipes/ParseObjectIdPipe';
import { SkipThrottle } from '@nestjs/throttler';

@Injectable()
@SkipThrottle()
@Controller('sa/users')
export class UsersSAController {
  constructor(
    public usersQuerySqlRepository: UsersQuerySqlRepository,
    private commandBus: CommandBus,
  ) {}

  @UseGuards(BasicAuthGuard)
  @Get()
  async getUsers(@QueryData() queryData: queryDataType) {
    const allUsers: newPaginatorViewType<getUserViewModel> =
      await this.usersQuerySqlRepository.getAllUsers(queryData);

    return allUsers;
  }

  @Get(':userId')
  async getUserById(@Param('userId') userId: string) {
    const user: getUserViewModel | null =
      await this.usersQuerySqlRepository.findUserById(userId);

    if (user) {
      return user;
    }
    throw new NotFoundException();
  }

  @UseGuards(BasicAuthGuard)
  @Delete(':userId')
  @HttpCode(204)
  async deleteUserById(@Param('userId', new ParseStringPipe()) userId: string) {
    const result = await this.commandBus.execute(new DeleteUserCommand(userId));
    if (result.data === null) {
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
    const newUserInfo = await this.usersQuerySqlRepository.findUserById(
      newUser.data,
    );
    return newUserInfo;
  }
}
