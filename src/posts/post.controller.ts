import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Injectable,
  NotFoundException,
  Param,
  Post,
  Put,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { PostService } from './post.service';
import {
  CreateCommentDto,
  CreatePostWithBlogIdDto,
  PaginatorPostViewType,
  PostViewModel,
} from './post.types';
import { Helpers, queryDataType } from '../helpers/helpers';
import {
  mappingErrorStatus,
  ResultCode,
  ResultObject,
} from '../helpers/heplersType';
import { JwtService } from '../jwt/jwt.service';
import {
  LikeStatusOptionVariable,
  PaginatorCommentViewType,
} from '../comments/comments.types';
import { CommentsService } from '../comments/comments.service';
import { ParseStringPipe } from '../pipes/ParseObjectIdPipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BasicAuthGuard } from '../auth/guards/basic-auth.guard';
import { QueryData } from '../helpers/decorators/helpers.decorator.queryData';
import { AccessTokenHeader, UserId } from '../users/decorators/user.decorator';
import { CommandBus } from '@nestjs/cqrs';
import { CreateCommentForPostCommand } from '../comments/application/use-cases/CreateCommentForPost';
import { DeletePostCommand } from './application/use-cases/DeletePost';
import { CreatePostCommand } from './application/use-cases/CreatePost';
import { UpdatePostCommand } from './application/use-cases/UpdatePost';
import { UpdatePostLikeStatusByIdCommand } from './application/use-cases/UpdatePostLikeStatusById';
import { GetUserIdByAccessTokenCommand } from '../jwt/application/use-cases/GetUserIdByAccessToken';
import { SkipThrottle } from '@nestjs/throttler';
import { PostQueryRepositorySql } from './postQuery.repository.sql';
import { UsersQuerySqlRepository } from '../users/usersQuery.repository.sql';
import { CommentsQueryRepositorySql } from '../comments/commentsQuery.repository.sql';

@Injectable()
@SkipThrottle()
@Controller('posts')
export class PostController {
  constructor(
    public postQueryRepository: PostQueryRepositorySql,
    public postService: PostService,
    public commentsService: CommentsService,
    public commentQueryRepository: CommentsQueryRepositorySql,
    public helpers: Helpers,
    public jwtService: JwtService,
    public usersQueryRepository: UsersQuerySqlRepository,
    private commandBus: CommandBus,
  ) {}

  @Get()
  async getPosts(
    @QueryData() queryData: queryDataType,
    @AccessTokenHeader() accessToken: string,
  ): Promise<PaginatorPostViewType | boolean> {
    const currentAccessToken = accessToken ? accessToken : null;
    const userId = await this.commandBus.execute(
      new GetUserIdByAccessTokenCommand(currentAccessToken),
    );
    return await this.postQueryRepository.getAllPosts(queryData, userId);
  }

  @Get(':postId')
  async getPostById(
    @Param('postId', new ParseStringPipe()) postId: string,
    @AccessTokenHeader() accessToken: string,
  ): Promise<PostViewModel | NotFoundException | null | number> {
    const currentAccessToken = accessToken ? accessToken : null;
    const userId = await this.commandBus.execute(
      new GetUserIdByAccessTokenCommand(currentAccessToken),
    );
    const foundPost: PostViewModel | null =
      await this.postQueryRepository.findPostById(postId, userId);
    if (foundPost === null)
      return mappingErrorStatus({
        data: null,
        resultCode: ResultCode.NotFound,
        message: 'couldn`t find post',
      });
    return foundPost;
  }

  @UseGuards(BasicAuthGuard)
  @Delete(':postId')
  @HttpCode(204)
  async deletePostById(
    @Param('postId', new ParseStringPipe()) postId: string,
  ): Promise<any> {
    const isDeleted: ResultObject<string> = await this.commandBus.execute(
      new DeletePostCommand(postId),
    );
    if (isDeleted.data === null) return mappingErrorStatus(isDeleted);
    return true;
  }

  @UseGuards(BasicAuthGuard)
  @Post()
  @HttpCode(201)
  async createPost(
    @Body() createPostDto: CreatePostWithBlogIdDto,
    // @Body('blogId') { blogId }: IsBlogExist,
  ) {
    const newPost: ResultObject<string> = await this.commandBus.execute(
      new CreatePostCommand(createPostDto, createPostDto.blogId),
    );
    if (newPost.data === null) return mappingErrorStatus(newPost);
    const gotNewPost: PostViewModel | null =
      await this.postQueryRepository.findPostById(newPost.data);

    return gotNewPost;
  }

  @UseGuards(BasicAuthGuard)
  @Put(':postId')
  @HttpCode(204)
  async updatePost(
    @Param('postId', new ParseStringPipe()) postId: string,
    @Body() createPostDto: CreatePostWithBlogIdDto,
  ) {
    const PostUpdatedInfo: ResultObject<string> = await this.commandBus.execute(
      new UpdatePostCommand(postId, createPostDto),
    );
    if (PostUpdatedInfo.data === null)
      return mappingErrorStatus(PostUpdatedInfo);
    return true;
  }

  @UseGuards(JwtAuthGuard)
  @Post(':postId/comments')
  async createCommentForPostById(
    @Param('postId', new ParseStringPipe()) postId: string,
    @Body() { content }: CreateCommentDto,
    @UserId() userId: string,
  ) {
    const currentUser = await this.usersQueryRepository.findUserById(userId);
    if (!currentUser) throw new UnauthorizedException();
    const newCommentId: ResultObject<string> = await this.commandBus.execute(
      new CreateCommentForPostCommand(postId, currentUser!, content),
    );
    if (newCommentId.data === null) return mappingErrorStatus(newCommentId);

    return await this.commentQueryRepository.getCommentById(
      newCommentId.data,
      currentUser!.id,
    );
  }

  @Get(':postId/comments')
  async getCommentForPostById(
    @QueryData() queryData: queryDataType,
    @Param('postId', new ParseStringPipe()) postId: string,
    @AccessTokenHeader() accessToken: string,
  ): Promise<PaginatorCommentViewType | null> {
    const currentAccessToken = accessToken ? accessToken : null;

    const userId = await this.commandBus.execute(
      new GetUserIdByAccessTokenCommand(currentAccessToken),
    );

    const currentPost = await this.postQueryRepository.findPostById(postId);
    if (!currentPost)
      return mappingErrorStatus({
        data: null,
        field: 'post id',
        resultCode: ResultCode.NotFound,
      });

    return await this.commentQueryRepository.getAllCommentsOfPost(
      postId,
      queryData,
      userId,
    );
  }
  @UseGuards(JwtAuthGuard)
  @Put(':postId/like-status')
  @HttpCode(204)
  async updatePostLikeStatus(
    @Param('postId', new ParseStringPipe()) postId: string,
    @Body() { likeStatus }: LikeStatusOptionVariable,
    //  @AccessTokenHeader() accessToken: string,
    @UserId() userId: string,
  ) {
    // const userId = await this.commandBus.execute(
    //   new GetUserIdByAccessTokenCommand(accessToken),
    // );
    const result = await this.commandBus.execute(
      new UpdatePostLikeStatusByIdCommand(postId, likeStatus, userId),
    );
    if (result.data === null) return mappingErrorStatus(result);
    return true;
  }
}
