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
import {
  BlogInputModel,
  BlogViewType,
  PaginatorBlogViewType,
} from './blogs.types';
import { Request } from 'express';
import { JwtService } from '../jwt/jwt.service';
import {
  PaginatorPostViewType,
  postInputDataModelForExistingBlog,
  PostViewModel,
} from '../posts/post.types';
import { ObjectId } from 'mongodb';
import { ResultObject } from '../helpers/heplersType';

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
      const queryData: queryDataType =
        await this.helpers.getDataFromQuery(query);
      const allBlogs: PaginatorBlogViewType =
        await this.blogQueryRepository.getAllBlogs(queryData);
      return allBlogs;
    } catch (e) {
      console.log(e);
      return new Error('something wrong');
    }
  }
  @Get(':id')
  async getBlogById(@Param('id') id: string) {
    const foundBlog: BlogViewType | null =
      await this.blogQueryRepository.findBlogById(id);
    if (foundBlog) {
      return foundBlog;
    }
    return new Error('something wrong status 404');
  }

  @Delete(':id')
  @HttpCode(204)
  // @HttpStatus(HttpStatusCode.NO_CONTENT)
  async deleteBlog(@Param('id') id: string) {
    const isDeleted: boolean = await this.blogService.deleteBlog(id);
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
    @Param('id') id: string,
    @Body() { name, description, websiteUrl },
  ) {
    const isExistBlog = await this.blogQueryRepository.findBlogById(id);
    if (!isExistBlog) {
      return false;
    }
    try {
      const BlogUpdateData: BlogInputModel = {
        name: name,
        description: description,
        websiteUrl: websiteUrl,
      };
      const isBlogUpdate: boolean = await this.blogService.updateBlog(
        id,
        BlogUpdateData,
      );
      if (isBlogUpdate) {
        return true;
      } else {
        return false;
      }
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  @Get(':blogId/posts')
  async getPostsFromBlogById(
    @Query() query: any,
    @Req() req: Request,
    @Param('blogId') blogId: string,
  ) {
    const isExistBlog = await this.blogQueryRepository.findBlogById(blogId);
    if (!isExistBlog) {
      throw new NotFoundException();
    }
    let userId: ObjectId | null = null;
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(' ')[1];
      userId = await this.jwtService.getUserIdByAccessToken(token.toString());
    }
    try {
      const queryData: queryDataType =
        await this.helpers.getDataFromQuery(query);
      const foundPosts: PaginatorPostViewType =
        await this.postQueryRepository.getAllPostOfBlog(
          blogId,
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
    @Param('blogId') blogId: string,
  ) {
    const isExistBlog = await this.blogQueryRepository.findBlogById(blogId);
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
        await this.postService.createPostForExistingBlog(blogId, postInputData);
      const gotNewPost: PostViewModel | null = newPost.data
        ? await this.postQueryRepository.findPostById(newPost.data)
        : null;
      return gotNewPost;
    } catch (e) {
      throw new InternalServerErrorException();
    }
  }
}
