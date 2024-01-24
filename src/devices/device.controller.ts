import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Injectable,
  NotFoundException,
  Param,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '../jwt/jwt.service';
import { DeviceQueryRepository } from './deviceQuery.repository';
import { DeviceService } from './device.service';
import { mappingErrorStatus } from '../helpers/heplersType';
import { CommandBus } from '@nestjs/cqrs';
import { DeleteOtherUserDeviceCommand } from './application/use-cases/DeleteOtherUserDevice';
import { DeleteUserDeviceByIdCommand } from './application/use-cases/DeleteUserDeviceById';
import { GetUserIdByRefreshTokenCommand } from '../jwt/application/use-cases/GetUserIdByRefreshToken';
import { GetTokenInfoByRefreshTokenCommand } from '../jwt/application/use-cases/GetTokenInfoByRefreshToken';
import { Cookies } from '../auth/decorators/auth.decorator';

@Injectable()
@Controller('security/devices')
export class DeviceController {
  constructor(
    public deviceService: DeviceService,
    public deviceQueryRepository: DeviceQueryRepository,
    public jwtService: JwtService,
    private commandBus: CommandBus,
  ) {}

  @Get()
  async getDevices(@Cookies('refreshToken') refreshToken: string) {
    const currentUserId = await this.commandBus.execute(
      new GetUserIdByRefreshTokenCommand(refreshToken),
    );
    if (currentUserId) {
      try {
        return await this.deviceQueryRepository.getAllDeviceSessions(
          currentUserId.toString(),
        );
      } catch (e) {
        throw new NotFoundException();
      }
    }
    throw new NotFoundException();
  }

  @Delete()
  @HttpCode(204)
  async deleteDevice(@Cookies('refreshToken') refreshToken: string) {
    const currentUserInfo = await this.commandBus.execute(
      new GetTokenInfoByRefreshTokenCommand(refreshToken),
    );
    if (currentUserInfo.data == null) mappingErrorStatus(currentUserInfo);

    const currentDeviceId = currentUserInfo.data.deviceId;
    const currentUserId = currentUserInfo.data.userId;

    const isDeleted: boolean = await this.commandBus.execute(
      new DeleteOtherUserDeviceCommand(currentUserId, currentDeviceId),
    );
    if (!isDeleted) {
      throw new UnauthorizedException();
    }
    return true;
  }

  @Delete(':deviceId')
  @HttpCode(204)
  async deleteDeviceByid(
    @Param('deviceId') deviceId: string,
    @Cookies('refreshToken') refreshToken: string,
  ) {
    const currentUserInfo = await this.commandBus.execute(
      new GetTokenInfoByRefreshTokenCommand(refreshToken),
    );
    if (currentUserInfo.data === null)
      return mappingErrorStatus(currentUserInfo);

    const result = await this.commandBus.execute(
      new DeleteUserDeviceByIdCommand(currentUserInfo.data, deviceId),
    );

    if (result.data === null) mappingErrorStatus(result);

    return true;
  }
}
