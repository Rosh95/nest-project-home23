import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserRepository } from '../../../users/user.repository';
import { UsersQueryRepository } from '../../../users/usersQuery.repository';
import { AuthService } from '../../auth.service';
import { AuthRepository } from '../../auth.repository';
import { JwtService } from '../../../jwt/jwt.service';

export class CheckCredentialCommand {
  constructor(
    public loginOrEmail: string,
    public password: string,
  ) {}
}

@CommandHandler(CheckCredentialCommand)
export class CheckCredential
  implements ICommandHandler<CheckCredentialCommand>
{
  constructor(
    public userRepository: UserRepository,
    public authService: AuthService,
    public authRepository: AuthRepository,
    public jwtService: JwtService,
    public usersQueryRepository: UsersQueryRepository,
  ) {}

  async execute(command: CheckCredentialCommand) {
    const user = await this.userRepository.findLoginOrEmail(
      command.loginOrEmail,
    );
    if (!user) return false;
    const passwordHash = await this.authService._generateHash(
      command.password,
      user.accountData.passwordSalt,
    );
    if (user.accountData.passwordHash === passwordHash) {
      return user._id;
    } else return false;
  }
}
