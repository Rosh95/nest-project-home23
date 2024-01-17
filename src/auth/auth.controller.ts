import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Injectable,
  Ip,
  Post,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtService } from '../jwt/jwt.service';
import { DeviceRepository } from '../devices/device.repository';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { UsersService } from '../users/users.service';
import { CreateUserDto, CurrentUserInfoType } from '../users/user.types';
import { emailAdapter } from '../email/email.adapter';
import { Types } from 'mongoose';
import { Cookies } from './decorators/auth.decorator';
import {
  mappingBadRequest,
  mappingErrorStatus,
  ResultObject,
} from '../helpers/heplersType';
import { AccessTokenHeader, UserId } from '../users/decorators/user.decorator';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { emailDto, newPasswordWithRecoveryCodeDto } from './auth.types';
import { CommandBus } from '@nestjs/cqrs';
import { FindUserByIdCommand } from '../users/application/use-cases/FindUserById';
import { CreateUserByRegistrationCommand } from './application/use-cases/CreateUserByRegistration';
import { ConfirmAndChangePasswordCommand } from './application/use-cases/ConfirmAndChangePassword';
import { ConfirmEmailCommand } from './application/use-cases/ConfirmEmail';
import { AddRecoveryCodeAndEmailCommand } from './application/use-cases/AddRecoveryCodeAndEmail';
import { ChangeUserConfirmationCodeCommand } from './application/use-cases/ChangeUserConfirmationCode';
import { AddDeviceInfoToDBCommand } from './application/use-cases/AddDeviceInfoToDB';
import { GetUserIdByAccessTokenCommand } from '../jwt/application/use-cases/GetUserIdByAccessToken';
import { GetTokenInfoByRefreshTokenCommand } from '../jwt/application/use-cases/GetTokenInfoByRefreshToken';

@Injectable()
@Controller('auth')
export class AuthController {
  constructor(
    public authService: AuthService,
    public jwtService: JwtService,
    public deviceRepository: DeviceRepository,
    public userService: UsersService,
    private commandBus: CommandBus,
  ) {}

  @Post('/login')
  @UseGuards(LocalAuthGuard)
  @HttpCode(200)
  async loginUser(
    @Res({ passthrough: true }) res: Response,
    @Headers('User-Agent') userAgent: string | 'unknow',
    @Ip() ip: string,
    @UserId() userId: string,
  ) {
    const tokensInfo = await this.commandBus.execute(
      new AddDeviceInfoToDBCommand(new Types.ObjectId(userId), userAgent, ip),
    );
    if (tokensInfo.data === null) return mappingErrorStatus(tokensInfo);
    res.cookie('refreshToken', tokensInfo.data.refreshToken, {
      httpOnly: true,
      secure: true,
    });
    res.header('accessToken', tokensInfo.data.accessToken.accessToken);
    return { accessToken: tokensInfo.data.accessToken };
  }

  @Post('/refresh-token')
  async refreshToken(
    @Res() res: Response,
    @Headers('User-Agent') userAgent: string | 'unknow',
    @Ip() ip: string,
    @Cookies('refreshToken') refreshToken: string,
  ) {
    const currentUserInfo = await this.commandBus.execute(
      new GetTokenInfoByRefreshTokenCommand(refreshToken),
    );
    if (!currentUserInfo.data) throw new UnauthorizedException();
    const currentUserId: string = currentUserInfo.data.userId;
    const currentDeviceId: string = currentUserInfo.data.deviceId;
    const tokens = await this.commandBus.execute(
      new AddDeviceInfoToDBCommand(
        new Types.ObjectId(currentUserId),
        currentDeviceId,
        ip,
        currentDeviceId,
      ),
    );
    return res
      .cookie('refreshToken', tokens.data.refreshToken, {
        httpOnly: true,
        secure: true,
      })
      .header('accessToken', tokens.data.accessToken)
      .status(200)
      .send(tokens.data.accessToken);
  }

  @Post('/logout')
  @HttpCode(204)
  async logoutUser(
    @Res() res: Response,
    @Cookies('refreshToken') refreshToken: string,
  ) {
    //убрать лишнюю инфу в базе данных ( обнулить дату создания )
    const currentUserInfo = await this.commandBus.execute(
      new GetTokenInfoByRefreshTokenCommand(refreshToken),
    );
    if (!currentUserInfo.data) return mappingErrorStatus(currentUserInfo);
    const currentUserId: string = currentUserInfo.data.userId;
    const currentDeviceId: string = currentUserInfo.data.deviceId;
    await this.deviceRepository.updateIssuedDate(
      currentUserId,
      currentDeviceId,
    );
    return res.clearCookie('refreshToken');
  }

  @Get('/me')
  async getInfoOfCurrentUser(@AccessTokenHeader() accessToken: string) {
    const userId = await this.commandBus.execute(
      new GetUserIdByAccessTokenCommand(accessToken),
    );
    if (!userId) throw new UnauthorizedException();
    const currentUser = await this.commandBus.execute(
      new FindUserByIdCommand(userId.toString()),
    );
    if (!currentUser) throw new BadRequestException('couldn`t find user');
    const currentUserInfo: CurrentUserInfoType = {
      login: currentUser.accountData.login,
      email: currentUser.accountData.email,
      userId: currentUser._id.toString(),
    };
    return currentUserInfo;
  }

  @Post('/registration')
  @HttpCode(204)
  async registrationUser(@Body() createUserDto: CreateUserDto) {
    const newUser: ResultObject<string> = await this.commandBus.execute(
      new CreateUserByRegistrationCommand(createUserDto),
    );
    if (newUser.data === null) return mappingErrorStatus(newUser);

    return true;
  }

  @Post('/registration-confirmation')
  @HttpCode(204)
  async registrationConfirmation(@Body('code') code: string) {
    if (!code || code.toString().length === 0)
      mappingBadRequest('code doesn`t exist', 'code');
    const result = await this.commandBus.execute(new ConfirmEmailCommand(code));
    if (!result.data) return mappingErrorStatus(result);
    return true;
  }

  @Post('/registration-email-resending')
  @HttpCode(204)
  async registrationEmailResending(@Body() { email }: emailDto) {
    const newUserConfirmationCode = await this.commandBus.execute(
      new ChangeUserConfirmationCodeCommand(email),
    );
    if (newUserConfirmationCode.data === null)
      return mappingErrorStatus(newUserConfirmationCode);

    try {
      await emailAdapter.sendConfirmationEmail(
        newUserConfirmationCode.data,
        email,
      );
    } catch (e) {
      mappingBadRequest('some error', 'code');
    }
    return true;
  }

  @Post('/password-recovery')
  @HttpCode(204)
  async passwordRecovery(@Body() { email }: emailDto) {
    const recoveryCode = await this.commandBus.execute(
      new AddRecoveryCodeAndEmailCommand(email),
    );
    if (recoveryCode.data === null) return mappingErrorStatus(recoveryCode);
    try {
      await emailAdapter.sendRecoveryPasswordEmail(recoveryCode.data, email);
      return true;
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  @Post('/new-password')
  @HttpCode(204)
  async getNewPassword(
    @Body() { newPassword, newRecoveryCode }: newPasswordWithRecoveryCodeDto,
  ) {
    const result = await this.commandBus.execute(
      new ConfirmAndChangePasswordCommand(newRecoveryCode, newPassword),
    );
    if (result.data === null) return mappingErrorStatus(result);
    return true;
  }
}
