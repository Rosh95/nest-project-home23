import mongoose from 'mongoose';
import { BlogDbType } from '../blogs/blogs.types';
import { PostDBModel } from '../posts/post.types';
import { NewUsersDBType } from '../users/user.types';
import { CommentsDBType } from '../comments/comments.types';
import { Device, DeviceDBModel, DeviceSchema } from '../devices/device.types';
import { LoginAttemptDBModel, RecoveryCodeDBModel } from '../auth/auth.types';
import { Blog, BlogSchema } from '../blogs/blog.schema';
import {
  LoginAttempt,
  LoginAttemptSchema,
  RecoveryCode,
  RecoveryCodeSchema,
} from '../auth/auth.schema';
import { Comment, CommentsSchema } from '../comments/comment.schema';
import { Post } from '@nestjs/common';
import { PostSchema } from '../posts/post.schema';
import { User, UsersSchema } from '../users/user.schema';

export const BlogModel = mongoose.model<BlogDbType>(Blog.name, BlogSchema);

export const PostModel = mongoose.model<PostDBModel>(Post.name, PostSchema);
export const UserModel = mongoose.model<NewUsersDBType>(User.name, UsersSchema);
export const CommentModel = mongoose.model<CommentsDBType>(
  Comment.name,
  CommentsSchema,
);
//export const deviceCollection = db.collection<DeviceDBModel>('devices');
export const DeviceModel = mongoose.model<DeviceDBModel>(
  Device.name,
  DeviceSchema,
);
export const LoginAttemptModel = mongoose.model<LoginAttemptDBModel>(
  LoginAttempt.name,
  LoginAttemptSchema,
);
export const RecoveryCodeModel = mongoose.model<RecoveryCodeDBModel>(
  RecoveryCode.name,
  RecoveryCodeSchema,
);
// export const LikeStatusModel = mongoose.model<LikeStatusDBType>(
//   LikeStatus.name,
//   LikeStatusSchema,
// );
