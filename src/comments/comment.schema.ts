import { HydratedDocument } from 'mongoose';
import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import {
  CommentatorInfo,
  LikesInfoViewModel,
  LikeStatusOption,
} from './comments.types';

export type CommentDocument = HydratedDocument<Comment>;

@Schema()
export class Comment {
  _id: ObjectId;
  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: String, required: true })
  postId: string;

  @Prop({ type: Date, default: Date.now() })
  createdAt: Date;

  @Prop(
    raw({
      userId: { type: ObjectId, require: true },
      userLogin: { type: String, require: true, default: 'Unknown user' },
    }),
  )
  commentatorInfo: CommentatorInfo;

  @Prop(
    raw({
      likesCount: { type: Number, require: true, default: 0 },
      dislikesCount: { type: Number, require: true, default: 0 },
      likeStatus: {
        type: String,
        enum: LikeStatusOption,
        require: true,
        default: LikeStatusOption.None,
      },
    }),
  )
  likesInfo: LikesInfoViewModel;
}

export const CommentsSchema = SchemaFactory.createForClass(Comment);
