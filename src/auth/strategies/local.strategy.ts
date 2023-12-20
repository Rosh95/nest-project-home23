import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { UsersQueryRepository } from '../../users/usersQuery.repository';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    public usersQueryRepository: UsersQueryRepository,
  ) {
    super({
      usernameField: 'loginOrEmail',
    });
  }

  async validate(loginOrEmail: string, password: string): Promise<any> {
    const userId = await this.authService.checkCredential(
      loginOrEmail,
      password,
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
