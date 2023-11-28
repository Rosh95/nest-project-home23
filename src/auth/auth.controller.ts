import { Body, Controller, Injectable, Post, Req, Res } from '@nestjs/common';
import { JwtService } from '../jwt/jwt.service';
import { DeviceRepository } from '../devices/device.repository';
import { AuthService } from './auth.service';
import { v4 as uuidv4 } from 'uuid';
import { deviceInputValue } from '../devices/device.types';
import { Request, Response } from 'express';
import { UsersService } from '../users/users.service';
import {
  CurrentUserInfoType,
  getUserViewModel,
  UserInputType,
} from '../users/user.types';
import { emailAdapter } from '../email/email.adapter';

@Injectable()
@Controller('auth')
export class AuthController {
  constructor(
    public authService: AuthService,
    public jwtService: JwtService,
    public deviceRepository: DeviceRepository,
    public userService: UsersService,
  ) {}

  @Post()
  async loginUser(
    @Req() req: Request,
    @Res() res: Response,
    @Body()
    { loginOrEmail, password }: { loginOrEmail: string; password: string },
  ) {
    const user = await this.authService.checkCredential(loginOrEmail, password);
    if (user) {
      const accessToken = await this.jwtService.createJWT(user);
      const deviceId = uuidv4();
      const refreshToken = await this.jwtService.createRefreshJWT(
        user,
        deviceId,
      );
      const deviceInfo: deviceInputValue = {
        userId: user._id.toString(),
        deviceId: deviceId,
        refreshToken: refreshToken.refreshToken,
        deviceName: req.headers['user-agent']
          ? req.headers['user-agent'].toString()
          : 'unknown',
        ip: req.ip!,
      };
      try {
        await this.authService.addDeviceInfoToDB(deviceInfo);
      } catch (e) {
        return false;
      }
      res.cookie('refreshToken', refreshToken.refreshToken, {
        httpOnly: true,
        secure: true,
      });
      res.header('accessToken', accessToken.accessToken);
      return res.status(200).send(accessToken);
    } else {
      return res.sendStatus(401);
    }
  }

  async refreshToken(req: Request, res: Response) {
    const refreshToken = req.cookies.refreshToken;
    const currentUserInfo =
      await this.jwtService.getTokenInfoByRefreshToken(refreshToken);
    if (!currentUserInfo) return res.sendStatus(401);
    const currentUserId: string = currentUserInfo.userId;
    const currentDeviceId: string = currentUserInfo.deviceId;
    const currentUser = currentUserId
      ? await this.userService.findUserById(currentUserId.toString())
      : null;
    if (currentUser) {
      const newAccessToken = await this.jwtService.createJWT(currentUser);
      const newRefreshToken = await this.jwtService.createRefreshJWT(
        currentUser,
        currentDeviceId,
      );
      const deviceInfo: deviceInputValue = {
        userId: currentUserId,
        deviceId: currentDeviceId,
        refreshToken: newRefreshToken.refreshToken,
        deviceName: req.headers['user-agent']
          ? req.headers['user-agent'].toString()
          : 'unknown',
        ip: req.ip!,
      };
      try {
        await this.authService.addDeviceInfoToDB(deviceInfo);
      } catch (e) {
        return false;
      }
      return res
        .cookie('refreshToken', newRefreshToken.refreshToken, {
          httpOnly: true,
          secure: true,
        })
        .header('accessToken', newAccessToken.accessToken)
        .status(200)
        .send(newAccessToken);
    }
    return res.sendStatus(401);
  }

  async logoutUser(req: Request, res: Response) {
    //убрать лишнюю инфу в базе данных ( обнулить дату создания )
    const refreshToken = req.cookies.refreshToken;
    const currentUserInfo =
      await this.jwtService.getTokenInfoByRefreshToken(refreshToken);
    if (!currentUserInfo) return res.sendStatus(401);
    const currentUserId: string = currentUserInfo.userId;
    const currentDeviceId: string = currentUserInfo.deviceId;
    await this.deviceRepository.updateIssuedDate(
      currentUserId,
      currentDeviceId,
    );
    return res.clearCookie('refreshToken').sendStatus(204);
  }

  async getInfoOfCurrentUser(req: Request, res: Response) {
    if (!req.headers.authorization) {
      res.sendStatus(401);
      return;
    }
    const currentUserInfo: CurrentUserInfoType = {
      login: req.user!.accountData.login,
      email: req.user!.accountData.email,
      userId: req.user!._id.toString(),
    };
    if (req.user) {
      return res.status(200).send(currentUserInfo);
    }
    return res.sendStatus(404);
  }

  async registrationUser(req: Request, res: Response) {
    const userPostInputData: UserInputType = {
      email: req.body.email,
      login: req.body.login,
      password: req.body.password,
    };
    const newUser: getUserViewModel | null =
      await this.authService.createUser(userPostInputData);
    if (newUser) {
      return res.sendStatus(204);
    }
    return res.sendStatus(400);
  }

  async registrationConfirmation(req: Request, res: Response) {
    const code = req.body.code;
    const result = await this.authService.confirmEmail(code);
    if (result) {
      return res.sendStatus(204);
    }
    return res.sendStatus(400);
  }

  async registrationEmailResending(req: Request, res: Response) {
    const email = req.body.email;

    const currentUser =
      await this.authService.changeUserConfirmationcode(email);
    if (currentUser) {
      try {
        await emailAdapter.sendConfirmationEmail(
          currentUser.emailConfirmation.confirmationCode,
          email,
        );
      } catch (e) {
        return null;
      }
      return res.sendStatus(204);
    }
    return res.sendStatus(400);
  }

  async passwordRecovery(req: Request, res: Response) {
    const email = req.body.email;
    // let foundUserByEmail = await userService.findUserByEmail(email)
    // if (!foundUserByEmail) return res.sendStatus(400)
    const recoveryCode = uuidv4();
    await this.authService.addRecoveryCodeAndEmail(email, recoveryCode);
    try {
      await emailAdapter.sendRecoveryPasswordEmail(recoveryCode, email);
      return res.sendStatus(204);
    } catch (e) {
      return null;
    }
  }

  async getNewPassword(req: Request, res: Response) {
    const recoveryCode = req.body.recoveryCode;
    const newPassword = req.body.newPassword;

    const result = await this.authService.сonfirmAndChangePassword(
      recoveryCode,
      newPassword,
    );
    if (result) {
      return res.sendStatus(204);
    }
    return res.sendStatus(400);
  }
}
