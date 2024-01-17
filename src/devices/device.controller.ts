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
import { mappingErrorStatus, ResultCode } from '../helpers/heplersType';
import { CommandBus } from '@nestjs/cqrs';
import { DeleteOtherUserDeviceCommand } from './application/use-cases/DeleteOtherUserDevice';
import { DeleteUserDeviceByIdCommand } from './application/use-cases/DeleteUserDeviceById';
import { GetUserIdByRefreshTokenCommand } from '../jwt/application/use-cases/GetUserIdByRefreshToken';
import { GetTokenInfoByRefreshTokenCommand } from '../jwt/application/use-cases/GetTokenInfoByRefreshToken';

@Injectable()
@Controller('devices')
export class DeviceController {
  constructor(
    public deviceService: DeviceService,
    public deviceQueryRepository: DeviceQueryRepository,
    public jwtService: JwtService,
    private commandBus: CommandBus,
  ) {}

  @Get()
  async getDevices(@Req() req: Request) {
    const refreshToken = req.cookies.refreshToken;
    const currentUserId = await this.commandBus.execute(
      new GetUserIdByRefreshTokenCommand(refreshToken),
    );
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
    const currentUserInfo = await this.commandBus.execute(
      new GetTokenInfoByRefreshTokenCommand(refreshToken),
    );
    if (currentUserInfo.data) {
      const currentDeviceId = currentUserInfo.data.deviceId;
      const currentUserId = currentUserInfo.data.userId;

      const isDeleted: boolean = await this.commandBus.execute(
        new DeleteOtherUserDeviceCommand(currentUserId, currentDeviceId),
      );
      if (isDeleted) {
        return true;
      }
      throw new NotFoundException();
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
    const currentUserInfo = await this.commandBus.execute(
      new GetTokenInfoByRefreshTokenCommand(refreshToken),
    );
    if (currentUserInfo.data === null)
      return mappingErrorStatus(currentUserInfo);

    const result = await this.commandBus.execute(
      new DeleteUserDeviceByIdCommand(
        currentUserInfo.data,
        req.params.deviceId,
      ),
    );
    if (result.resultCode !== ResultCode.Success) {
      const returnStatus = mapStatus(result.resultCode);
      return res.status(returnStatus).send(result.message);
    }
    return true;
  }
}

const mapStatus = (resultCode: ResultCode) => {
  switch (resultCode) {
    case ResultCode.BadRequest:
      return 400;
    case ResultCode.NoContent:
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
