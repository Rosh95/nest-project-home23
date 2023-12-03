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
import { BlogService } from './blogs.service';
import { BlogQueryRepository } from './blogQuery.repository';
import { PostService } from '../posts/post.service';
import { PostQueryRepository } from '../posts/postQuery.repository';
import { Helpers, queryDataType } from '../helpers/helpers';
import { BlogInputModel, BlogViewType } from './blogs.types';
import { Request } from 'express';
import { JwtService } from '../jwt/jwt.service';
import {
  PaginatorPostViewType,
  postInputDataModelForExistingBlog,
  PostViewModel,
} from '../posts/post.types';
import { ResultObject } from '../helpers/heplersType';
import { ParseObjectIdPipe } from '../pipes/ParseObjectIdPipe';
import { Types } from 'mongoose';

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
  async getBlogs(@Query() query: any) {
    try {
      const queryData: queryDataType = this.helpers.getDataFromQuery(query);

      // const allBlogs: PaginatorBlogViewType =
      //   await this.blogQueryRepository.getAllBlogs(queryData);

      return await this.blogQueryRepository.getAllBlogs(queryData);
    } catch (e) {
      console.log(e);
      return new Error('something wrong');
    }
  }
  @Get(':blogId')
  async getBlogById(
    @Param('blogId', new ParseObjectIdPipe()) blogId: Types.ObjectId,
  ) {
    const isExistBlog = await this.blogQueryRepository.findBlogById(
      blogId.toString(),
    );
    if (!isExistBlog) {
      throw new NotFoundException();
    }
    const foundBlog: BlogViewType | null =
      await this.blogQueryRepository.findBlogById(blogId.toString());
    if (foundBlog) {
      return foundBlog;
    }
    return new Error('something wrong status 404');
  }

  @Delete(':blogId')
  @HttpCode(204)
  // @HttpStatus(HttpStatusCode.NO_CONTENT)
  async deleteBlog(
    @Param('blogId', new ParseObjectIdPipe()) blogId: Types.ObjectId,
  ) {
    const isExistBlog = await this.blogQueryRepository.findBlogById(
      blogId.toString(),
    );
    if (!isExistBlog) {
      throw new NotFoundException();
    }
    const isDeleted: boolean = await this.blogService.deleteBlog(
      blogId.toString(),
    );
    if (isDeleted) {
      return true;
    } else false;
  }

  @Post()
  // @HttpStatus(HttpStatusCode.CREATED)
  async createBlog(@Body() { name, description, websiteUrl }) {
    try {
      const BlogInputData: BlogInputModel = {
        name: name,
        description: description,
        websiteUrl: websiteUrl,
      };
      const newBlog: BlogViewType =
        await this.blogService.createBlog(BlogInputData);

      return newBlog;
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  @Put(':id')
  @HttpCode(204)
  async updateBlog(
    @Param('id', new ParseObjectIdPipe()) id: Types.ObjectId,
    @Body() { name, description, websiteUrl },
  ) {
    const isExistBlog = await this.blogQueryRepository.findBlogById(
      id.toString(),
    );
    console.log(isExistBlog);
    if (!isExistBlog) {
      throw new NotFoundException();
    }
    console.log(isExistBlog);

    const BlogUpdateData: BlogInputModel = {
      name: name,
      description: description,
      websiteUrl: websiteUrl,
    };
    const isBlogUpdate: boolean = await this.blogService.updateBlog(
      id.toString(),
      BlogUpdateData,
    );
    return isBlogUpdate;
  }

  @Get(':blogId/posts')
  async getPostsFromBlogById(
    @Query() query: any,
    @Req() req: Request,
    @Param('blogId', new ParseObjectIdPipe()) blogId: Types.ObjectId,
  ) {
    const isExistBlog = await this.blogQueryRepository.findBlogById(
      blogId.toString(),
    );
    if (!isExistBlog) {
      throw new NotFoundException();
    }
    let userId: Types.ObjectId | null = null;
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(' ')[1];
      userId = await this.jwtService.getUserIdByAccessToken(token.toString());
    }
    try {
      const queryData: queryDataType =
        await this.helpers.getDataFromQuery(query);
      const foundPosts: PaginatorPostViewType =
        await this.postQueryRepository.getAllPostOfBlog(
          blogId.toString(),
          queryData,
          userId,
        );
      return foundPosts;
    } catch (e) {
      throw new InternalServerErrorException();
    }
  }

  @Post(':blogId/posts')
  @HttpCode(201)
  async createPostForBlogById(
    @Query() query: any,
    @Req() req: Request,
    @Param('blogId', new ParseObjectIdPipe()) blogId: Types.ObjectId,
  ) {
    const isExistBlog = await this.blogQueryRepository.findBlogById(
      blogId.toString(),
    );
    if (!isExistBlog) {
      throw new NotFoundException();
    }
    try {
      const postInputData: postInputDataModelForExistingBlog = {
        title: req.body.title,
        shortDescription: req.body.shortDescription,
        content: req.body.content,
      };
      const newPost: ResultObject<string> =
        await this.postService.createPostForExistingBlog(
          blogId.toString(),
          postInputData,
        );
      const gotNewPost: PostViewModel | null = newPost.data
        ? await this.postQueryRepository.findPostById(newPost.data)
        : null;
      return gotNewPost;
    } catch (e) {
      throw new InternalServerErrorException();
    }
  }
}
