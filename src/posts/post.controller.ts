import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PostService } from './post.service';
import { PostRepository } from './post.repository';
import { PostQueryRepository } from './postQuery.repository';
import { BlogQueryRepository } from '../blogs/blogQuery.repository';
import {
  PaginatorPostViewType,
  postInputDataModel,
  postInputUpdatedDataModel,
  PostViewModel,
} from './post.types';
import e, { Request } from 'express';
import { Helpers, queryDataType } from '../helpers/helpers';
import { ObjectId } from 'mongodb';
import { BlogViewType } from '../blogs/blogs.types';
import { ResultObject } from '../helpers/heplersType';
import { jwtService } from '../jwt/jwt.service';
import {
  CommentsInputData,
  PaginatorCommentViewType,
} from '../comments/comments.types';
import { CommentsService } from '../comments/comments.service';
import { CommentsQueryRepository } from '../comments/commentsQuery.repository';
import { ParseObjectIdPipe } from '../pipes/ParseObjectIdPipe';
import { Types } from 'mongoose';
import { NewUsersDBType } from '../users/user.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BasicAuthGuard } from '../auth/guards/basic-auth.guard';

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
  ) {}

  @Get()
  //@Header('authorization', 'none')
  async getPosts(
    @Query() query: any,
    @Req() req: Request, // userId : string | null
    //@CurrentUserId: {userId :string} | {userId: null}
  ): Promise<PaginatorPostViewType | boolean> {
    let userId: ObjectId | null = null;
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(' ')[1];
      userId = await jwtService.getUserIdByAccessToken(token.toString());
    }
    try {
      const queryData: queryDataType =
        await this.helpers.getDataFromQuery(query);
      const allPosts: PaginatorPostViewType =
        await this.postQueryRepository.getAllPosts(queryData, userId);
      return allPosts;
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  @Get(':postId')
  async getPostById(
    @Param('postId', new ParseObjectIdPipe()) postId: Types.ObjectId,
    @Req() req: Request,
  ): Promise<PostViewModel | boolean | null> {
    let userId: ObjectId | null = null;
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(' ')[1];
      userId = await jwtService.getUserIdByAccessToken(token.toString());
    }
    const isExistPost = await this.postQueryRepository.findPostById(
      postId.toString(),
    );
    if (!isExistPost) {
      throw new NotFoundException();
    }
    try {
      const foundPost: PostViewModel | null =
        await this.postQueryRepository.findPostById(postId.toString(), userId);
      if (foundPost) {
        return foundPost;
      }
      return false;
    } catch (e) {
      console.log(e);
      return null;
    }
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
    if (!isExistPost) {
      throw new NotFoundException();
    }
    const isDeleted: boolean = await this.postService.deletePost(
      postId.toString(),
    );
    if (!isDeleted) throw new NotFoundException();
    return;
  }

  @UseGuards(BasicAuthGuard)
  @Post()
  async createPost(
    @Body()
    {
      title,
      shortDescription,
      content,
      blogId,
    }: {
      title: string;
      shortDescription: string;
      content: string;
      blogId: string;
    },
  ) {
    const foundBlog: BlogViewType | null =
      await this.blogQueryRepository.findBlogById(blogId);
    if (!foundBlog) {
      return false;
    }
    try {
      const postInputData: postInputDataModel = {
        title: title,
        shortDescription: shortDescription,
        content: content,
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
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put(':postId')
  @HttpCode(204)
  async updatePost(
    @Body()
    postUpdateData: {
      title: string;
      shortDescription: string;
      content: string;
    },
    @Param('postId', new ParseObjectIdPipe()) postId: Types.ObjectId,
  ) {
    const isExistPost = await this.postQueryRepository.findPostById(
      postId.toString(),
    );
    if (!isExistPost) {
      throw new NotFoundException();
    }
    try {
      const updatedPostData: postInputUpdatedDataModel = {
        content: postUpdateData.content,
        title: postUpdateData.title,
        shortDescription: postUpdateData.shortDescription,
      };
      const isPostUpdated: boolean = await this.postService.updatePost(
        postId.toString(),
        updatedPostData,
      );
      return isPostUpdated;
    } catch (e) {
      return false;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/comments')
  async createCommentForPostById(
    @Param('id', new ParseObjectIdPipe()) id: Types.ObjectId,
    @Req() req: Request,
  ) {
    const currentPost: PostViewModel | null =
      await this.postQueryRepository.findPostById(id.toString());
    if (!currentPost) {
      return false;
    }
    try {
      if (!req.user) {
        throw new Error('user doesn`t exist');
      }
      const currentUser = req.user as NewUsersDBType;
      const newCommentData: CommentsInputData = {
        content: req.body.content,
        userId: currentUser._id,
        userLogin: currentUser.accountData.login,
        postId: req.params.postId,
      };

      const newCommentObjectId: ObjectId =
        await this.commentsService.createCommentForPost(newCommentData);
      const newComment = await this.commentQueryRepository.getCommentById(
        newCommentObjectId.toString(),
        currentUser._id,
      );
      return newComment;
    } catch (e) {
      throw new InternalServerErrorException();
    }
  }

  @Get(':postId')
  async getCommentForPostById(
    @Req() req: Request,
    @Param('postId', new ParseObjectIdPipe()) postId: Types.ObjectId,
  ): Promise<e.Response | PaginatorCommentViewType> {
    let userId: ObjectId | null = null;
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(' ')[1];
      userId = await jwtService.getUserIdByAccessToken(token.toString());
    }

    const currentPost = await this.postQueryRepository.findPostById(
      postId.toString(),
    );
    if (!currentPost) {
      throw new NotFoundException();
    }
    try {
      const queryData: queryDataType = await this.helpers.getDataFromQuery(
        req.query,
      );
      const comments: PaginatorCommentViewType =
        await this.commentQueryRepository.getAllCommentsOfPost(
          postId.toString(),
          queryData,
          userId,
        );
      return comments;
    } catch (e) {
      throw new InternalServerErrorException();
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put(':postId/like-status')
  @HttpCode(204)
  async updatePostLikeStatus(
    @Req() req: Request,
    @Param('postId', new ParseObjectIdPipe()) postId: Types.ObjectId,
  ) {
    const currentUser = req.user;

    try {
      const postInfo = await this.postRepository.getPostById(postId.toString());
      if (!postInfo) {
        throw new NotFoundException();
      }
      await this.postService.updatePostLikeStatusById(
        postInfo,
        req.body.likeStatus,
        currentUser! as NewUsersDBType,
      );
      return true;
    } catch (e) {
      console.log(e);
      throw new InternalServerErrorException();
    }
  }
}
