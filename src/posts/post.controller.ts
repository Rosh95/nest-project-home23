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
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { PostService } from './post.service';
import { PostQueryRepository } from './postQuery.repository';
import {
  CreateCommentDto,
  CreatePostDto,
  CreatePostWithBlogIdDto,
  PaginatorPostViewType,
  PostIdDto,
  PostViewModel,
} from './post.types';
import { Request } from 'express';
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
import { CommentsQueryRepository } from '../comments/commentsQuery.repository';
import { ParseObjectIdPipe } from '../pipes/ParseObjectIdPipe';
import { Types } from 'mongoose';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BasicAuthGuard } from '../auth/guards/basic-auth.guard';
import { QueryData } from '../helpers/decorators/helpers.decorator.queryData';
import { AccessTokenHeader, UserId } from '../users/decorators/user.decorator';
import { UsersQueryRepository } from '../users/usersQuery.repository';
import { CommandBus } from '@nestjs/cqrs';
import { CreateCommentForPostCommand } from '../comments/application/use-cases/CreateCommentForPost';
import { DeletePostCommand } from './application/use-cases/DeletePost';
import { CreatePostCommand } from './application/use-cases/CreatePost';
import { UpdatePostCommand } from './application/use-cases/UpdatePost';
import { UpdatePostLikeStatusByIdCommand } from './application/use-cases/UpdatePostLikeStatusById';
import { GetUserIdByAccessTokenCommand } from '../jwt/application/use-cases/GetUserIdByAccessToken';

@Injectable()
@Controller('posts')
export class PostController {
  constructor(
    public postQueryRepository: PostQueryRepository,
    public postService: PostService,
    public commentsService: CommentsService,
    public commentQueryRepository: CommentsQueryRepository,
    public helpers: Helpers,
    public jwtService: JwtService,
    public usersQueryRepository: UsersQueryRepository,
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
    @Param('postId', new ParseObjectIdPipe()) postId: Types.ObjectId,
    @AccessTokenHeader() accessToken: string,
  ): Promise<PostViewModel | NotFoundException | null | number> {
    const currentAccessToken = accessToken ? accessToken : null;
    const userId = await this.commandBus.execute(
      new GetUserIdByAccessTokenCommand(currentAccessToken),
    );
    const foundPost: PostViewModel | null =
      await this.postQueryRepository.findPostById(postId.toString(), userId);
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
    @Param('postId', new ParseObjectIdPipe()) postId: Types.ObjectId,
  ): Promise<any> {
    //if (!postId) new NotFoundException();
    const isDeleted: ResultObject<string> = await this.commandBus.execute(
      new DeletePostCommand(postId.toString()),
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
    @Body() createPostDto: CreatePostDto,
    @Param() postId: PostIdDto,
  ) {
    //if (!postId) new NotFoundException();
    const PostUpdatedInfo: ResultObject<string> = await this.commandBus.execute(
      new UpdatePostCommand(postId.postId, createPostDto),
    );
    if (PostUpdatedInfo.data === null)
      return mappingErrorStatus(PostUpdatedInfo);
    return true;
  }

  @UseGuards(JwtAuthGuard)
  @Post(':postId/comments')
  async createCommentForPostById(
    @Param('postId', new ParseObjectIdPipe()) postId: Types.ObjectId,
    @Req() req: Request,
    @Body() { content }: CreateCommentDto,
    @UserId() userId: string,
  ) {
    const currentUser = await this.usersQueryRepository.findUserById(userId);
    if (!currentUser) new UnauthorizedException();
    const newCommentObjectId: ResultObject<string> =
      await this.commandBus.execute(
        new CreateCommentForPostCommand(
          postId.toString(),
          currentUser!,
          content,
        ),
      );
    if (newCommentObjectId.data === null)
      return mappingErrorStatus(newCommentObjectId);

    return await this.commentQueryRepository.getCommentById(
      newCommentObjectId.data,
      new Types.ObjectId(currentUser!.id),
    );
  }

  @Get(':postId/comments')
  async getCommentForPostById(
    @QueryData() queryData: queryDataType,
    @Param('postId', new ParseObjectIdPipe()) postId: Types.ObjectId,
    @AccessTokenHeader() accessToken: string,
  ): Promise<PaginatorCommentViewType | number> {
    const currentAccessToken = accessToken ? accessToken : null;

    const userId = await this.commandBus.execute(
      new GetUserIdByAccessTokenCommand(currentAccessToken),
    );

    const currentPost = await this.postQueryRepository.findPostById(
      postId.toString(),
    );
    if (!currentPost)
      return mappingErrorStatus({
        data: null,
        field: 'post id',
        resultCode: ResultCode.NotFound,
      });

    return await this.commentQueryRepository.getAllCommentsOfPost(
      postId.toString(),
      queryData,
      userId,
    );
  }
  @UseGuards(JwtAuthGuard)
  @Put(':postId/like-status')
  @HttpCode(204)
  async updatePostLikeStatus(
    @Param('postId', new ParseObjectIdPipe()) postId: Types.ObjectId,
    @Body() { likeStatus }: LikeStatusOptionVariable,
    @UserId() userId: string,
  ) {
    const result = await this.commandBus.execute(
      new UpdatePostLikeStatusByIdCommand(
        postId.toString(),
        likeStatus,
        userId,
      ),
    );
    if (result.data === null) return mappingErrorStatus(result);
    return true;
  }
}
