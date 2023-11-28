import { LikeStatusOption } from '../comments/comments.types';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { HydratedDocument } from 'mongoose';

export type LikeStatusDBType = {
  entityId: string;
  userId: string;
  userLogin: string;
  likeStatus: LikeStatusOption;
  createdAt: Date;
};
//
// export const LikeStatusSchema = new mongoose.Schema<LikeStatusDBType>({
//   entityId: { type: String, require: true },
//   userId: { type: String, require: true },
//   userLogin: { type: String, require: true },
//   likeStatus: {
//     type: String,
//     enum: LikeStatusOption,
//     require: true,
//     default: LikeStatusOption.None,
//   },
//   createdAt: { type: Date, default: Date.now() },
// });

export type LikeStatusDocument = HydratedDocument<LikeStatus>;

@Schema()
export class LikeStatus {
  _id: ObjectId;
  @Prop({ type: String, required: true })
  entityId: string;

  @Prop({ type: String, required: true })
  userId: string;

  @Prop({ type: String, required: true })
  userLogin: string;

  @Prop({
    type: String,
    enum: LikeStatusOption,
    require: true,
    default: LikeStatusOption.None,
  })
  likeStatus: LikeStatusOption;

  @Prop({ type: Date, default: Date.now() })
  createdAt: Date;
}

export const LikeStatusSchema = SchemaFactory.createForClass(LikeStatus);
