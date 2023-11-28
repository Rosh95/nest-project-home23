import { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';

export type PostDocument = HydratedDocument<Post>;

@Schema()
export class Post {
  _id: ObjectId;
  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  shortDescription: string;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: String, required: true })
  blogId: string;

  @Prop({ type: String, required: true })
  blogName: string;

  @Prop({ type: Date, default: Date.now() })
  createdAt: Date;
}

export const PostSchema = SchemaFactory.createForClass(Post);
