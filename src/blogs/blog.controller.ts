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
import { ResultObject } from '../helpers/heplersType';
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
    return foundBlog ? foundBlog : new NotFoundException();
  }

  @UseGuards(BasicAuthGuard)
  @Delete(':blogId')
  @HttpCode(204)
  async deleteBlog(
    @Param('blogId', new ParseObjectIdPipe()) blogId: Types.ObjectId,
  ) {
    const result = await this.blogService.deleteBlog(blogId.toString());
    return result ? result : new NotFoundException();
  }

  @Post()
  async createBlog(@Body() inputData: CreateBlogDto) {
    const newBlog: BlogViewType = await this.blogService.createBlog(inputData);
    return newBlog;
  }

  @UseGuards(BasicAuthGuard)
  @Put(':id')
  @HttpCode(204)
  async updateBlog(
    @Param('id', new ParseObjectIdPipe()) id: Types.ObjectId,
    @Body() createBlogDto: CreateBlogDto,
  ) {
    const isBlogUpdate: boolean | null = await this.blogService.updateBlog(
      id.toString(),
      createBlogDto,
    );
    return isBlogUpdate ? isBlogUpdate : new NotFoundException();
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
    return foundPosts ? foundPosts : null;
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
    const newPost: ResultObject<string> | null =
      await this.postService.createPostForExistingBlog(
        blogId.toString(),
        createPostDto,
      );
    if (!newPost) return new NotFoundException();
    const gotNewPost: PostViewModel | null = newPost.data
      ? await this.postQueryRepository.findPostById(newPost.data)
      : null;
    return gotNewPost;
  }
}
