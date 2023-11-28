import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Injectable,
  NotFoundException,
  Param,
  Req,
  Res,
} from '@nestjs/common';
import { JwtService } from '../jwt/jwt.service';
import { DeviceQueryRepository } from './deviceQuery.repository';
import { DeviceService } from './device.service';
import { Request, Response } from 'express';
import { ResultCode } from '../helpers/heplersType';

@Injectable()
@Controller('devices')
export class DeviceController {
  constructor(
    public deviceService: DeviceService,
    public deviceQueryRepository: DeviceQueryRepository,
    public jwtService: JwtService,
  ) {}

  @Get()
  async getDevices(@Req() req: Request) {
    const refreshToken = req.cookies.refreshToken;
    const currentUserId =
      await this.jwtService.getUserIdByRefreshToken(refreshToken);
    if (currentUserId) {
      try {
        const currentSessions =
          await this.deviceQueryRepository.getAllDeviceSessions(
            currentUserId.toString(),
          );
        return currentSessions;
      } catch (e) {
        throw new NotFoundException();
      }
    }
    throw new NotFoundException();
  }

  @Delete()
  @HttpCode(204)
  async deleteDevice(@Req() req: Request) {
    const refreshToken = req.cookies.refreshToken;
    const currentUserInfo =
      await this.jwtService.getTokenInfoByRefreshToken(refreshToken);
    if (currentUserInfo) {
      const currentDeviceId = currentUserInfo.deviceId;
      const currentUserId = currentUserInfo.userId;
      try {
        const isDeleted: boolean =
          await this.deviceService.deleteOtherUserDevice(
            currentUserId,
            currentDeviceId,
          );
        if (isDeleted) {
          return true;
        }
        throw new NotFoundException();
      } catch (e) {
        throw new NotFoundException();
      }
    }
    throw new NotFoundException();
  }

  @Delete(':deviceId')
  @HttpCode(204)
  async deleteDeviceByid(
    @Req() req: Request,
    @Res() res: Response,
    @Param('deviceId') deviceId: string,
  ) {
    if (!deviceId) {
      throw new NotFoundException();
    }
    const refreshToken = req.cookies.refreshToken;
    const currentUserInfo =
      await this.jwtService.getTokenInfoByRefreshToken(refreshToken);
    if (!currentUserInfo) {
      throw new NotFoundException();
    }
    const result = await this.deviceService.deleteUserDeviceById(
      currentUserInfo,
      req.params.deviceId,
    );
    if (result.resultCode !== ResultCode.Success) {
      const returnStatus = mapStatus(result.resultCode);
      return res.status(returnStatus).send(result.errorMessage);
    }
    return true;
  }
}

const mapStatus = (resultCode: ResultCode) => {
  switch (resultCode) {
    case ResultCode.BadRequest:
      return 400;
    case ResultCode.DeviceNotFound:
      return 404;
    case ResultCode.Forbidden:
      return 403;
    case ResultCode.Success:
      return 200;
    case ResultCode.NotFound:
      return 404;
    case ResultCode.ServerError:
      return 500;
    default:
      return 418;
  }
};