import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../users/user.schema';
import { Model } from 'mongoose';
import { Blog, BlogDocument } from '../blogs/blog.schema';
import { Injectable } from '@nestjs/common';
import { PostDocument, Post } from '../posts/post.schema';
import { Comment, CommentDocument } from '../comments/comment.schema';
import { Device, DeviceDocument } from '../devices/device.types';
import { LoginAttempt, LoginAttemptDocument } from '../auth/auth.schema';

@Injectable()
export class TestingRepository {
  constructor(
    @InjectModel(Blog.name) public blogModel: Model<BlogDocument>,
    @InjectModel(User.name) public userModel: Model<UserDocument>,
    @InjectModel(Post.name) public postModel: Model<PostDocument>,
    @InjectModel(Comment.name) public commentModel: Model<CommentDocument>,
    @InjectModel(Device.name) public deviceModel: Model<DeviceDocument>,
    @InjectModel(LoginAttempt.name)
    public loginAttemptModel: Model<LoginAttemptDocument>,
  ) {}

  async deleteAll() {
    await this.blogModel.deleteMany({});
    await this.postModel.deleteMany({});
    await this.userModel.deleteMany({});
    await this.commentModel.deleteMany({});
    await this.deviceModel.deleteMany({});
    await this.loginAttemptModel.deleteMany({});
    return;
  }
}
