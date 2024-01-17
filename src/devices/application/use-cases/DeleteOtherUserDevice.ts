import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeviceRepository } from '../../device.repository';

export class DeleteOtherUserDeviceCommand {
  constructor(
    public userId: string,
    public deviceId: string,
  ) {}
}

@CommandHandler(DeleteOtherUserDeviceCommand)
export class DeleteOtherUserDevice
  implements ICommandHandler<DeleteOtherUserDeviceCommand>
{
  constructor(public deviceRepository: DeviceRepository) {}

  async execute(command: DeleteOtherUserDeviceCommand): Promise<boolean> {
    return await this.deviceRepository.deleteOtherUserDevice(
      command.userId,
      command.deviceId,
    );
  }
}
