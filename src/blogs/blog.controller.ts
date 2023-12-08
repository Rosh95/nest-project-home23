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
  Query,
  Req,
  UnauthorizedException,
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
    // const queryData: queryDataType = this.helpers.getDataFromQuery(queryData);
    return await this.blogQueryRepository.getAllBlogs(queryData);
  }

  @UseGuards(BasicAuthGuard)
  @Get(':blogId')
  async getBlogById(
    @Param('blogId', new ParseObjectIdPipe()) blogId: Types.ObjectId,
  ) {
    const isExistBlog = await this.blogQueryRepository.findBlogById(
      blogId.toString(),
    );
    if (!isExistBlog) throw new NotFoundException();
    const foundBlog: BlogViewType | null =
      await this.blogQueryRepository.findBlogById(blogId.toString());

    return foundBlog ? foundBlog : new Error('something wrong status 404');
  }

  @UseGuards(BasicAuthGuard)
  @Delete(':blogId')
  @HttpCode(204)
  async deleteBlog(
    @Param('blogId', new ParseObjectIdPipe()) blogId: Types.ObjectId,
  ) {
    const isExistBlog = await this.blogQueryRepository.findBlogById(
      blogId.toString(),
    );
    if (!isExistBlog) throw new NotFoundException();

    return await this.blogService.deleteBlog(blogId.toString());
  }

  @Post()
  // @HttpStatus(HttpStatusCode.CREATED)
  async createBlog(@Body() inputData: CreateBlogDto) {
    inputData.name = '';
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
    const isExistBlog = await this.blogQueryRepository.findBlogById(
      id.toString(),
    );
    if (!isExistBlog) throw new NotFoundException();
    const isBlogUpdate: boolean = await this.blogService.updateBlog(
      id.toString(),
      createBlogDto,
    );
    return isBlogUpdate;
  }

  @Get(':blogId/posts')
  async getPostsFromBlogById(
    @QueryData() queryData: queryDataType,
    @Req() req: Request,
    @Param('blogId', new ParseObjectIdPipe()) blogId: Types.ObjectId,
    @AccessTokenHeader() accessToken: string,
  ) {
    const isExistBlog = await this.blogQueryRepository.findBlogById(
      blogId.toString(),
    );
    if (!isExistBlog) throw new NotFoundException();

    if (!accessToken) throw new UnauthorizedException();

    const userId = await this.jwtService.getUserIdByAccessToken(accessToken);

    // const queryData: queryDataType =
    //   await this.helpers.getDataFromQuery(query);
    const foundPosts: PaginatorPostViewType =
      await this.postQueryRepository.getAllPostOfBlog(
        blogId.toString(),
        queryData,
        userId,
      );
    return foundPosts;
  }

  @UseGuards(BasicAuthGuard)
  @Post(':blogId/posts')
  @HttpCode(201)
  async createPostForBlogById(
    @Query() query: any,
    @Req() req: Request,
    @Param('blogId', new ParseObjectIdPipe()) blogId: Types.ObjectId,
    @Body() createPostDto: CreatePostDto,
  ) {
    const isExistBlog = await this.blogQueryRepository.findBlogById(
      blogId.toString(),
    );
    if (!isExistBlog) throw new NotFoundException();

    const newPost: ResultObject<string> =
      await this.postService.createPostForExistingBlog(
        blogId.toString(),
        createPostDto,
      );
    const gotNewPost: PostViewModel | null = newPost.data
      ? await this.postQueryRepository.findPostById(newPost.data)
      : null;
    return gotNewPost;
  }
}
