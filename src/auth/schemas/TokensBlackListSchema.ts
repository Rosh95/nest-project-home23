import { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type TokensBlackListDocument = HydratedDocument<TokensBlackList>;

@Schema()
export class TokensBlackList {
  @Prop({ type: String, required: true })
  token: string;
}

export const TokensBlackListSchema =
  SchemaFactory.createForClass(TokensBlackList);
