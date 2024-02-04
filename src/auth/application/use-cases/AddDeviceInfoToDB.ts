import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserRepository } from '../../../users/user.repository';
import { UsersQueryRepository } from '../../../users/usersQuery.repository';
import { AuthRepository } from '../../auth.repository';
import { Types } from 'mongoose';
import { ResultCode, ResultObject } from '../../../helpers/heplersType';
import { v4 as uuidv4 } from 'uuid';
import { DeviceDBModel } from '../../../devices/device.types';
import { CreateJWTCommand } from '../../../jwt/application/use-cases/CreateJWT';
import { CreateRefreshJWTCommand } from '../../../jwt/application/use-cases/CreateRefreshJWT';
import { GetTokenInfoByRefreshTokenCommand } from '../../../jwt/application/use-cases/GetTokenInfoByRefreshToken';

export class AddDeviceInfoToDBCommand {
  constructor(
    public userId: Types.ObjectId,
    public userAgent: string,
    public ip: string,
    public deviceId?: string,
  ) {}
}

@CommandHandler(AddDeviceInfoToDBCommand)
export class AddDeviceInfoToDB
  implements ICommandHandler<AddDeviceInfoToDBCommand>
{
  constructor(
    public userRepository: UserRepository,
    public authRepository: AuthRepository,
    public usersQueryRepository: UsersQueryRepository,
    private commandBus: CommandBus,
  ) {}

  async execute(command: AddDeviceInfoToDBCommand): Promise<ResultObject<any>> {
    const accessToken = await this.commandBus.execute(
      new CreateJWTCommand(command.userId),
    );
    const currentDeviceId = command.deviceId ? command.deviceId : uuidv4();
    const refreshToken = await this.commandBus.execute(
      new CreateRefreshJWTCommand(command.userId, currentDeviceId),
    );

    const getInfoFromRefreshToken = await this.commandBus.execute(
      new GetTokenInfoByRefreshTokenCommand(refreshToken.refreshToken),
    );

    if (getInfoFromRefreshToken.data === null) {
      return {
        data: null,
        resultCode: ResultCode.BadRequest,
        message: 'couldn`t get refreshToken',
      };
    }
    const result: DeviceDBModel = {
      userId: command.userId.toString(),
      issuedAt: getInfoFromRefreshToken.data.iat,
      expirationAt: getInfoFromRefreshToken.data.exp,
      deviceId: currentDeviceId,
      ip: command.ip,
      deviceName: command.userAgent,
    };
    const isCreated =
      await this.authRepository.createOrUpdateRefreshToken(result);
    console.log(isCreated);
    console.log('isCreated');
    if (!isCreated) {
      return {
        data: null,
        resultCode: ResultCode.BadRequest,
        message: 'couldn`t get refreshToken',
      };
    }
    return {
      data: {
        accessToken: accessToken.accessToken,
        refreshToken: refreshToken.refreshToken,
      },
      resultCode: ResultCode.Success,
    };
  }
}
