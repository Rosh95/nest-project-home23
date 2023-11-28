import { HydratedDocument } from 'mongoose';
import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  _id: ObjectId;
  @Prop(
    raw({
      login: { type: String, require: true },
      email: { type: String, require: true },
      passwordHash: String,
      passwordSalt: String,
      createdAt: { type: Date, default: Date.now() },
    }),
  )
  accountData: {
    login: string;
    email: string;
    passwordHash: string;
    passwordSalt: string;
    createdAt: Date;
  };

  @Prop(
    raw({
      confirmationCode: { type: String, require: true, default: 0 },
      emailExpiration: { type: Date, default: Date.now() },
      isConfirmed: { type: Boolean, default: false },
    }),
  )
  emailConfirmation: {
    confirmationCode: string;
    emailExpiration: Date;
    isConfirmed: boolean;
  };
}

export const UsersSchema = SchemaFactory.createForClass(User);
