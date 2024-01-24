import { IsNotEmpty, IsString, Length } from 'class-validator';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type LoginSuccessViewModel = {
  accessToken: string;
};
export type LoginSuccessViewModelForRefresh = {
  refreshToken: string;
};

export type LoginAttemptDBModel = {
  ip: string;
  url: string;
  date: Date;
};
export type RecoveryCodeDBModel = {
  email: string;
  recoveryCode: string;
};

export class CreateLoginDto {
  @IsNotEmpty()
  @IsString()
  @Length(1)
  loginOrEmail: string;

  @IsNotEmpty()
  @IsString()
  @Length(1)
  password: string;
}
export class emailDto {
  @IsNotEmpty()
  @IsString()
  @Length(1)
  email: string;
}

export class newPasswordWithRecoveryCodeDto {
  @IsNotEmpty()
  @IsString()
  @Length(6, 20)
  newPassword: string;

  @IsNotEmpty()
  @IsString()
  @Length(1)
  newRecoveryCode: string;
}
export const Cookies = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return data ? request.cookies?.[data] : request.cookies;
  },
);
// export const LoginAttemptSchema = new mongoose.Schema<LoginAttemptDBModel>({
//   ip: { type: String, require: true },
//   url: { type: String, require: true },
//   date: { type: Date, default: Date.now() },
// });

// @Schema()
// export class LoginAttempt {
//   @Prop({ type: String, required: true })
//   ip: string;
//   @Prop({ type: String, required: true })
//   url: string;
//   @Prop({ type: Date, default: Date.now() })
//   date: Date;
// }
//
// export const LoginAttemptSchema = SchemaFactory.createForClass(LoginAttempt);
//
// @Schema()
// export class RecoveryCode {
//   @Prop({ type: String, required: true })
//   email: string;
//
//   @Prop({ type: String, required: true })
//   recoveryCode: string;
// }
//
// export const RecoveryCodeSchema = SchemaFactory.createForClass(RecoveryCode);
