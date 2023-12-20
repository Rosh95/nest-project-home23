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
  UseGuards,
} from '@nestjs/common';
import { BlogService } from './blogs.service';
import { BlogQueryRepository } from './blogQuery.repository';
import { PostService } from '../posts/post.service';
import { PostQueryRepository } from '../posts/postQuery.repository';
import { Helpers, queryDataType } from '../helpers/helpers';
import { BlogViewType, CreateBlogDto } from './blogs.types';
import { Request } from 'express';
import { JwtService } from '../jwt/jwt.service';
import {
  CreatePostDto,
  PaginatorPostViewType,
  PostViewModel,
} from '../posts/post.types';
import { mappingErrorStatus, ResultObject } from '../helpers/heplersType';
import { ParseObjectIdPipe } from '../pipes/ParseObjectIdPipe';
import { Types } from 'mongoose';
import { BasicAuthGuard } from '../auth/guards/basic-auth.guard';
import { QueryData } from '../helpers/decorators/helpers.decorator.queryData';
import { AccessTokenHeader } from '../users/decorators/user.decorator';

@Injectable()
@Controller('blogs')
export class BlogController {
  constructor(
    public blogService: BlogService,
    public blogQueryRepository: BlogQueryRepository,
    public postService: PostService,
    public postQueryRepository: PostQueryRepository,
    public jwtService: JwtService,
    public helpers: Helpers,
  ) {}

  @Get()
  async getBlogs(@QueryData() queryData: queryDataType) {
    return await this.blogQueryRepository.getAllBlogs(queryData);
  }

  @UseGuards(BasicAuthGuard)
  @Get(':blogId')
  async getBlogById(
    @Param('blogId', new ParseObjectIdPipe()) blogId: Types.ObjectId,
  ) {
    const foundBlog: BlogViewType | null =
      await this.blogQueryRepository.findBlogById(blogId.toString());
    if (foundBlog) {
      return foundBlog;
    }
    throw new NotFoundException({
      message: { error: 'couldn`t find' },
    });
  }

  @UseGuards(BasicAuthGuard)
  @Delete(':blogId')
  @HttpCode(204)
  async deleteBlog(
    @Param('blogId', new ParseObjectIdPipe()) blogId: Types.ObjectId,
  ) {
    const result = await this.blogService.deleteBlog(blogId.toString());
    if (result) {
      return true;
    }
    mappingErrorStatus(result);
  }

  @Post()
  async createBlog(@Body() inputData: CreateBlogDto) {
    const createBlogInfo: ResultObject<string> =
      await this.blogService.createBlog(inputData);
    if (createBlogInfo.data) {
      return await this.blogQueryRepository.findBlogById(createBlogInfo.data);
    }
    mappingErrorStatus(createBlogInfo);
  }

  @UseGuards(BasicAuthGuard)
  @Put(':blogId')
  @HttpCode(204)
  async updateBlog(
    @Param('blogId', new ParseObjectIdPipe()) blogId: Types.ObjectId,
    @Body() createBlogDto: CreateBlogDto,
  ) {
    const updateBlog: ResultObject<string> = await this.blogService.updateBlog(
      blogId.toString(),
      createBlogDto,
    );
    if (updateBlog.data === null) {
      mappingErrorStatus(updateBlog);
    }
    return true;
  }

  @Get(':blogId/posts')
  async getPostsFromBlogById(
    @QueryData() queryData: queryDataType,
    @Req() req: Request,
    @Param('blogId', new ParseObjectIdPipe()) blogId: Types.ObjectId,
    @AccessTokenHeader() accessToken: string,
  ) {
    const currentAccessToken = accessToken ? accessToken : null;
    const userId =
      await this.jwtService.getUserIdByAccessToken(currentAccessToken);
    const foundPosts: PaginatorPostViewType | null =
      await this.postQueryRepository.getAllPostOfBlog(
        blogId.toString(),
        queryData,
        userId,
      );
    if (foundPosts === null) {
      throw new NotFoundException();
    }
    return foundPosts;
  }

  @UseGuards(BasicAuthGuard)
  @Post(':blogId/posts')
  @HttpCode(201)
  async createPostForBlogById(
    @QueryData() queryData: queryDataType,
    @Req() req: Request,
    @Param('blogId', new ParseObjectIdPipe()) blogId: Types.ObjectId,
    @Body() createPostDto: CreatePostDto,
  ) {
    const newPost: ResultObject<string> =
      await this.postService.createPostForExistingBlog(
        blogId.toString(),
        createPostDto,
      );
    if (newPost.data === null) {
      return mappingErrorStatus(newPost);
    }
    const gotNewPost: PostViewModel | null = newPost.data
      ? await this.postQueryRepository.findPostById(newPost.data)
      : null;
    return gotNewPost;
  }
}
