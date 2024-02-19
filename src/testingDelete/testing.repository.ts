import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class TestingRepository {
  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    // @InjectModel(Blog.name) public blogModel: Model<BlogDocument>,
    // @InjectModel(User.name) public userModel: Model<UserDocument>,
    // @InjectModel(Post.name) public postModel: Model<PostDocument>,
    // @InjectModel(Comment.name) public commentModel: Model<CommentDocument>,
    // @InjectModel(Device.name) public deviceModel: Model<DeviceDocument>,
    // @InjectModel(LoginAttempt.name)
    // public loginAttemptModel: Model<LoginAttemptDocument>,
  ) {}

  async deleteAll() {
    await this.dataSource.query(`
        DELETE from public."EmailConfirmationUser";
        DELETE from public."TokensBlackList";
        DELETE from public."LikeStatusForPosts";
        DELETE from public."LikeStatusForPosts";
        DELETE from public."LikeStatusForComments";
        DELETE from public."RecoveryCodes";
        DELETE from public."LoginAttempts";
        DELETE from public."Devices";
        DELETE from public."Comments";
        DELETE from public."Posts";
        DELETE from public."Blogs";
        DELETE from public."Users";
      `);

    // await this.dataSource.query(`
    // TRUNCATE public."Users", public."EmailConfirmationUser", public."Devices",
    //  public."LikeStatusForPosts",public."LikeStatusForComments",public."RecoveryCodes",
    //  public."Blogs", public."Posts",public."LoginAttempts",
    //  public."TokensBlackList",public."Comments",
    //   CASCADE
    //   `);
    // await this.blogModel.deleteMany({});
    // await this.postModel.deleteMany({});
    // await this.userModel.deleteMany({});
    // await this.commentModel.deleteMany({});
    // await this.deviceModel.deleteMany({});
    // await this.loginAttemptModel.deleteMany({});
    return true;
  }
}
