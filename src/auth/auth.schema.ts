import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type LoginAttemptDocument = HydratedDocument<LoginAttempt>;
export type RecoveryCodeDocument = HydratedDocument<RecoveryCode>;

@Schema()
export class LoginAttempt {
  @Prop({ type: String, required: true })
  ip: string;
  @Prop({ type: String, required: true })
  url: string;
  @Prop({ type: Date, default: Date.now() })
  date: Date;
}

export const LoginAttemptSchema = SchemaFactory.createForClass(LoginAttempt);

@Schema()
export class RecoveryCode {
  @Prop({ type: String, required: true })
  email: string;

  @Prop({ type: String, required: true })
  recoveryCode: string;
}

export const RecoveryCodeSchema = SchemaFactory.createForClass(RecoveryCode);
