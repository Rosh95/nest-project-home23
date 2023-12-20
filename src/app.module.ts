import { Module, Post } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';
import { UserRepository } from './users/user.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { Cat, CatSchema } from './cats/cats-shema';
import { CatsRepository } from './cats/cats.repository';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getMongoUri } from './getMongoUri';
import { PostController } from './posts/post.controller';
import { AuthController } from './auth/auth.controller';
import { BlogController } from './blogs/blog.controller';
import { CommentsController } from './comments/comments.controller';
import { DeviceController } from './devices/device.controller';
import { UsersQueryRepository } from './users/usersQuery.repository';
import { AuthRepository } from './auth/auth.repository';
import { AuthService } from './auth/auth.service';
import { BlogRepository } from './blogs/blog.repository';
import { BlogQueryRepository } from './blogs/blogQuery.repository';
import { BlogService } from './blogs/blogs.service';
import { CommentsService } from './comments/comments.service';
import { CommentsRepository } from './comments/comments.repository';
import { CommentsQueryRepository } from './comments/commentsQuery.repository';
import { DeviceQueryRepository } from './devices/deviceQuery.repository';
import { DeviceService } from './devices/device.service';
import { DeviceRepository } from './devices/device.repository';
import { PostService } from './posts/post.service';
import { PostQueryRepository } from './posts/postQuery.repository';
import { PostRepository } from './posts/post.repository';
import { JwtService } from './jwt/jwt.service';
import { Helpers } from './helpers/helpers';
import { LikeStatus, LikeStatusSchema } from './likeStatus/likeStatus.type';

import { Device, DeviceSchema } from './devices/device.types';
import { Blog, BlogSchema } from './blogs/blog.schema';
import {
  LoginAttempt,
  LoginAttemptSchema,
  RecoveryCode,
  RecoveryCodeSchema,
} from './auth/auth.schema';
import { Comment, CommentsSchema } from './comments/comment.schema';
import { PostSchema } from './posts/post.schema';
import { User, UsersSchema } from './users/user.schema';
import { TestingController } from './testingDelete/testing.controller';
import { TestingService } from './testingDelete/testing.service';
import { TestingRepository } from './testingDelete/testing.repository';
import { BasicStrategy } from './auth/strategies/basic.strategy';
import { BasicAuthGuard } from './auth/guards/basic-auth.guard';
import { JwtStrategy } from './auth/strategies/jwt.strategy';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { JwtModule } from '@nestjs/jwt';
import { settings } from './settings';
import { LocalAuthGuard } from './auth/guards/local-auth.guard';
import { LocalStrategy } from './auth/strategies/local.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(getMongoUri()),
    JwtModule.register({
      secret: settings.JWT_SECRET,
      signOptions: { expiresIn: '10m' },
    }),
    MongooseModule.forFeature([
      { name: Cat.name, schema: CatSchema },
      { name: Blog.name, schema: BlogSchema },
      { name: Post.name, schema: PostSchema },
      { name: LikeStatus.name, schema: LikeStatusSchema },
      { name: RecoveryCode.name, schema: RecoveryCodeSchema },
      { name: LoginAttempt.name, schema: LoginAttemptSchema },
      { name: User.name, schema: UsersSchema },
      { name: Device.name, schema: DeviceSchema },
      { name: Comment.name, schema: CommentsSchema },
    ]),
  ],
  controllers: [
    AppController,
    UsersController,
    PostController,
    AuthController,
    BlogController,
    CommentsController,
    DeviceController,
    TestingController,
  ],
  providers: [
    AppService,
    UsersService,
    UserRepository,
    UsersQueryRepository,
    CatsRepository,
    AuthRepository,
    AuthService,
    BlogRepository,
    BlogQueryRepository,
    BlogService,
    CommentsService,
    CommentsRepository,
    CommentsQueryRepository,
    DeviceQueryRepository,
    DeviceService,
    DeviceRepository,
    PostService,
    PostQueryRepository,
    PostRepository,
    JwtService,
    Helpers,
    TestingService,
    TestingRepository,
    ConfigService,
    BasicStrategy,
    BasicAuthGuard,
    JwtStrategy,
    JwtAuthGuard,
    LocalAuthGuard,
    LocalStrategy,
  ],
})
export class AppModule {}
