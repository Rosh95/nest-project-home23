import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { UsersQueryRepository } from '../../users/usersQuery.repository';
import { CommandBus } from '@nestjs/cqrs';
import { CheckCredentialCommand } from '../application/use-cases/CheckCredential';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    public usersQueryRepository: UsersQueryRepository,
    private commandBus: CommandBus,
  ) {
    super({
      usernameField: 'loginOrEmail',
    });
  }

  async validate(loginOrEmail: string, password: string): Promise<any> {
    const userId = await this.commandBus.execute(
      new CheckCredentialCommand(loginOrEmail, password),
    );
    if (!userId) {
      throw new UnauthorizedException();
    }
    const user = await this.usersQueryRepository.findUserById(
      userId.toString(),
    );
    if (!user) throw new UnauthorizedException();
    return { userId: user!.id };
  }
}
