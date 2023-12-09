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
  PaginatorPostViewType,
  PostViewModel,
} from './post.types';
import { Request } from 'express';
import { Helpers, queryDataType } from '../helpers/helpers';
import { ObjectId } from 'mongodb';
import { ResultObject } from '../helpers/heplersType';
import { JwtService } from '../jwt/jwt.service';
import {
  LikeStatusOption,
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
  ) {}

  @Get()
  async getPosts(
    @QueryData() queryData: queryDataType,
    @Req() req: Request,
    @AccessTokenHeader() accessToken: string,
  ): Promise<PaginatorPostViewType | boolean> {
    const currentAccessToken = accessToken ? accessToken : null;
    const userId =
      await this.jwtService.getUserIdByAccessToken(currentAccessToken);
    return await this.postQueryRepository.getAllPosts(queryData, userId);
  }

  @Get(':postId')
  async getPostById(
    @Param('postId', new ParseObjectIdPipe()) postId: Types.ObjectId,
    @Req() req: Request,
    @AccessTokenHeader() accessToken: string,
  ): Promise<PostViewModel | NotFoundException | null> {
    const currentAccessToken = accessToken ? accessToken : null;
    const userId =
      await this.jwtService.getUserIdByAccessToken(currentAccessToken);
    const foundPost: PostViewModel | null =
      await this.postQueryRepository.findPostById(postId.toString(), userId);
    if (!foundPost) return new NotFoundException();
    return foundPost ? foundPost : null;
  }

  @UseGuards(BasicAuthGuard)
  @Delete(':postId')
  @HttpCode(204)
  async deletePostById(
    @Param('postId', new ParseObjectIdPipe()) postId: Types.ObjectId,
  ): Promise<any> {
    const isDeleted: boolean | null = await this.postService.deletePost(
      postId.toString(),
    );
    if (!isDeleted) throw new NotFoundException();
    return true;
  }

  @UseGuards(BasicAuthGuard)
  @Post()
  async createPost(
    @Body() createPostDto: CreatePostDto,
    @Body() blogId: string,
  ) {
    const newPost: ResultObject<string> | null =
      await this.postService.createPost(createPostDto, blogId);
    if (!newPost) return new NotFoundException();
    const gotNewPost: PostViewModel | null = newPost.data
      ? await this.postQueryRepository.findPostById(newPost.data)
      : null;
    return gotNewPost;
  }

  @UseGuards(JwtAuthGuard)
  @Put(':postId')
  @HttpCode(204)
  async updatePost(
    @Param('postId', new ParseObjectIdPipe()) postId: Types.ObjectId,
    @Body() createPostDto: CreatePostDto,
  ) {
    const isPostUpdated: boolean | null = await this.postService.updatePost(
      postId.toString(),
      createPostDto,
    );
    return isPostUpdated ? isPostUpdated : new NotFoundException();
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
    const newCommentObjectId: ObjectId | null =
      await this.commentsService.createCommentForPost(
        postId.toString(),
        currentUser,
        content,
      );
    if (!newCommentObjectId) return new NotFoundException();
    const newComment = await this.commentQueryRepository.getCommentById(
      newCommentObjectId.toString(),
      new Types.ObjectId(currentUser!.id),
    );
    return newComment;
  }

  @Get(':postId/comments')
  async getCommentForPostById(
    @QueryData() queryData: queryDataType,
    @Param('postId', new ParseObjectIdPipe()) postId: Types.ObjectId,
    @AccessTokenHeader() accessToken: string,
  ): Promise<PaginatorCommentViewType> {
    const currentAccessToken = accessToken ? accessToken : null;

    const userId =
      await this.jwtService.getUserIdByAccessToken(currentAccessToken);

    const currentPost = await this.postQueryRepository.findPostById(
      postId.toString(),
    );
    if (!currentPost) throw new NotFoundException();

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
    @Body() likeStatus: LikeStatusOption,
    @UserId() userId: string,
  ) {
    const result = await this.postService.updatePostLikeStatusById(
      postId.toString(),
      likeStatus,
      userId,
    );
    return result ? true : new NotFoundException();
  }
}
