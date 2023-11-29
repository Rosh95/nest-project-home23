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
    @Param('postId') postId: string,
    @Req() req: Request,
  ): Promise<PostViewModel | boolean | null> {
    let userId: ObjectId | null = null;
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(' ')[1];
      userId = await jwtService.getUserIdByAccessToken(token.toString());
    }
    const isExistPost = await this.postQueryRepository.findPostById(postId);
    if (!isExistPost) {
      return false;
    }
    try {
      const foundPost: PostViewModel | null =
        await this.postQueryRepository.findPostById(postId, userId);
      if (foundPost) {
        return foundPost;
      }
      return false;
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  @Delete('posId')
  @HttpCode(204)
  async deletePostById(@Param('postId') postId: string): Promise<any> {
    const isExistPost = await this.postQueryRepository.findPostById(postId);
    if (!isExistPost) {
      return false;
    }
    const isDeleted: boolean = await this.postService.deletePost(postId);
    if (!isDeleted) throw new NotFoundException();

    return;
  }

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

  @Put(':postId')
  @HttpCode(204)
  async updatePost(
    @Query() { title, shortDescription, content },
    @Param('postId') postId: string,
  ) {
    const isExistPost = await this.postQueryRepository.findPostById(postId);
    if (!isExistPost) {
      return false;
    }
    try {
      const updatedPostData: postInputUpdatedDataModel = {
        content: content,
        title: title,
        shortDescription: shortDescription,
      };
      const isPostUpdated: boolean = await this.postService.updatePost(
        postId,
        updatedPostData,
      );
      if (isPostUpdated) {
        return true;
      } else {
        return false;
      }
    } catch (e) {
      return false;
    }
  }

  @Post(':id')
  async createCommentForPostById(@Param() id: string, @Req() req: Request) {
    const currentPost: PostViewModel | null =
      await this.postQueryRepository.findPostById(id);
    if (!currentPost) {
      return false;
    }
    try {
      if (!req.user) {
        throw new Error('user doesn`t exist');
      }
      const newCommentData: CommentsInputData = {
        content: req.body.content,
        userId: req.user._id,
        userLogin: req.user.accountData.login,
        postId: req.params.postId,
      };

      const newCommentObjectId: ObjectId =
        await this.commentsService.createCommentForPost(newCommentData);
      const newComment = await this.commentQueryRepository.getCommentById(
        newCommentObjectId.toString(),
        req.user._id,
      );
      return newComment;
    } catch (e) {
      throw new InternalServerErrorException();
    }
  }

  @Get(':postId')
  async getCommentForPostById(
    @Req() req: Request,
    @Param('postId') postId: string,
  ): Promise<e.Response | PaginatorCommentViewType> {
    let userId: ObjectId | null = null;
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(' ')[1];
      userId = await jwtService.getUserIdByAccessToken(token.toString());
    }

    const currentPost = await this.postQueryRepository.findPostById(postId);
    if (!currentPost) {
      throw new NotFoundException();
    }
    try {
      const queryData: queryDataType = await this.helpers.getDataFromQuery(
        req.query,
      );
      const comments: PaginatorCommentViewType =
        await this.commentQueryRepository.getAllCommentsOfPost(
          postId,
          queryData,
          userId,
        );
      return comments;
    } catch (e) {
      throw new InternalServerErrorException();
    }
  }

  @Put('postId')
  @HttpCode(204)
  async updatePostLikeStatus(
    @Req() req: Request,
    @Param('postId') postId: string,
  ) {
    const currentUser = req.user;

    try {
      const postInfo = await this.postRepository.getPostById(postId);
      if (!postInfo) {
        throw new NotFoundException();
      }
      await this.postService.updatePostLikeStatusById(
        postInfo,
        req.body.likeStatus,
        currentUser!,
      );
      return true;
    } catch (e) {
      console.log(e);
      throw new InternalServerErrorException();
    }
  }
}
