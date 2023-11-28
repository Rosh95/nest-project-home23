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
