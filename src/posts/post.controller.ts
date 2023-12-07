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
import { PostRepository } from './post.repository';
import { PostQueryRepository } from './postQuery.repository';
import { BlogQueryRepository } from '../blogs/blogQuery.repository';
import {
  CreatePostDto,
  PaginatorPostViewType,
  postInputDataModel,
  PostViewModel,
} from './post.types';
import e, { Request } from 'express';
import { Helpers, queryDataType } from '../helpers/helpers';
import { ObjectId } from 'mongodb';
import { BlogViewType } from '../blogs/blogs.types';
import { ResultObject } from '../helpers/heplersType';
import { JwtService } from '../jwt/jwt.service';
import {
  CommentsInputData,
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
    public postRepository: PostRepository,
    public postQueryRepository: PostQueryRepository,
    public blogQueryRepository: BlogQueryRepository,
    public postService: PostService,
    public commentsService: CommentsService,
    public commentQueryRepository: CommentsQueryRepository,
    public helpers: Helpers,
    public jwtService: JwtService,
    public usersQueryRepository: UsersQueryRepository,
  ) {}

  @Get()
  //@Header('authorization', 'none')
  async getPosts(
    @QueryData() queryData: queryDataType,
    @Req() req: Request,
    @AccessTokenHeader() accessToken: string,
    // userId : string | null
    //@CurrentUserId: {userId :string} | {userId: null}
  ): Promise<PaginatorPostViewType | boolean> {
    if (!accessToken) throw new UnauthorizedException();

    const userId = await this.jwtService.getUserIdByAccessToken(accessToken);
    const allPosts: PaginatorPostViewType =
      await this.postQueryRepository.getAllPosts(queryData, userId);
    return allPosts;
  }

  @Get(':postId')
  async getPostById(
    @Param('postId', new ParseObjectIdPipe()) postId: Types.ObjectId,
    @Req() req: Request,
    @AccessTokenHeader() accessToken: string,
  ): Promise<PostViewModel | boolean | null> {
    if (!accessToken) throw new UnauthorizedException();

    const userId = await this.jwtService.getUserIdByAccessToken(accessToken);
    const isExistPost = await this.postQueryRepository.findPostById(
      postId.toString(),
    );
    if (!isExistPost) throw new NotFoundException();
    const foundPost: PostViewModel | null =
      await this.postQueryRepository.findPostById(postId.toString(), userId);
    return foundPost ? foundPost : false;
  }

  @UseGuards(BasicAuthGuard)
  @Delete(':postId')
  @HttpCode(204)
  async deletePostById(
    @Param('postId', new ParseObjectIdPipe()) postId: Types.ObjectId,
  ): Promise<any> {
    const isExistPost = await this.postQueryRepository.findPostById(
      postId.toString(),
    );
    if (!isExistPost) throw new NotFoundException();
    const isDeleted: boolean = await this.postService.deletePost(
      postId.toString(),
    );
    if (!isDeleted) throw new NotFoundException();
    return;
  }

  @UseGuards(BasicAuthGuard)
  @Post()
  async createPost(
    @Body() createPostDto: CreatePostDto,
    @Body() blogId: string,
  ) {
    const foundBlog: BlogViewType | null =
      await this.blogQueryRepository.findBlogById(blogId);
    if (!foundBlog) return false;
    const postInputData: postInputDataModel = {
      title: createPostDto.title,
      shortDescription: createPostDto.shortDescription,
      content: createPostDto.content,
      blogId: blogId,
    };
    const newPost: ResultObject<string> = await this.postService.createPost(
      postInputData,
      foundBlog,
    );
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
    const isExistPost = await this.postQueryRepository.findPostById(
      postId.toString(),
    );
    if (!isExistPost) throw new NotFoundException();

    const isPostUpdated: boolean = await this.postService.updatePost(
      postId.toString(),
      createPostDto,
    );
    return isPostUpdated;
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/comments')
  async createCommentForPostById(
    @Param('id', new ParseObjectIdPipe()) id: Types.ObjectId,
    @Req() req: Request,
    @UserId() userId: string,
  ) {
    const currentPost: PostViewModel | null =
      await this.postQueryRepository.findPostById(id.toString());
    if (!currentPost) throw new NotFoundException();
    if (!userId) throw new Error('user doesn`t exist');
    const currentUser = await this.usersQueryRepository.findUserById(userId);
    const newCommentData: CommentsInputData = {
      content: req.body.content,
      userId: new Types.ObjectId(currentUser!.id),
      userLogin: currentUser!.login,
      postId: req.params.postId,
    };

    const newCommentObjectId: ObjectId =
      await this.commentsService.createCommentForPost(newCommentData);
    const newComment = await this.commentQueryRepository.getCommentById(
      newCommentObjectId.toString(),
      new Types.ObjectId(currentUser!.id),
    );
    return newComment;
  }

  @Get(':postId')
  async getCommentForPostById(
    @QueryData() queryData: queryDataType,
    @Req() req: Request,
    @Param('postId', new ParseObjectIdPipe()) postId: Types.ObjectId,
    @AccessTokenHeader() accessToken: string,
  ): Promise<e.Response | PaginatorCommentViewType> {
    if (!accessToken) throw new UnauthorizedException();

    const userId = await this.jwtService.getUserIdByAccessToken(accessToken);

    const currentPost = await this.postQueryRepository.findPostById(
      postId.toString(),
    );
    if (!currentPost) throw new NotFoundException();

    const comments: PaginatorCommentViewType =
      await this.commentQueryRepository.getAllCommentsOfPost(
        postId.toString(),
        queryData,
        userId,
      );
    return comments;
  }

  @UseGuards(JwtAuthGuard)
  @Put(':postId/like-status')
  @HttpCode(204)
  async updatePostLikeStatus(
    @Req() req: Request,
    @Param('postId', new ParseObjectIdPipe()) postId: Types.ObjectId,
    @Body() likeStatus: LikeStatusOption,
    @UserId() userId: string,
  ) {
    const currentUser = await this.usersQueryRepository.findUserById(userId);

    const postInfo = await this.postRepository.getPostById(postId.toString());
    if (!postInfo) {
      throw new NotFoundException();
    }
    await this.postService.updatePostLikeStatusById(
      postInfo,
      likeStatus,
      currentUser!,
    );
    return true;
  }
}
