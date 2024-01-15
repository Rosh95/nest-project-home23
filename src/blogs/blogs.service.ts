import { Injectable } from '@nestjs/common';
import { BlogRepository } from './blog.repository';
import { BlogQueryRepository } from './blogQuery.repository';
import { BlogDbType, CreateBlogDto } from './blogs.types';
import { ObjectId } from 'mongodb';
import { Helpers } from '../helpers/helpers';
import { ResultCode, ResultObject } from '../helpers/heplersType';

@Injectable()
export class BlogService {
  constructor(
    protected blogQueryRepository: BlogQueryRepository,
    protected blogRepository: BlogRepository,
    public helpers: Helpers,
  ) {}

  async deleteBlog(blogId: string): Promise<ResultObject<string>> {
    const isExistBlog = await this.blogQueryRepository.findBlogById(blogId);
    if (!isExistBlog) {
      return {
        data: null,
        resultCode: ResultCode.NotFound,
        message: 'couldn`t find blog',
        field: 'blog',
      };
    }
    const deleteBlog = await this.blogRepository.deleteBlog(blogId);
    if (!deleteBlog) {
      return {
        data: null,
        resultCode: ResultCode.BadRequest,
        message: 'couldn`t  delete blog',
      };
    }
    return {
      data: 'ok',
      resultCode: ResultCode.NoContent,
    };
  }

  async createBlog(blogData: CreateBlogDto): Promise<ResultObject<string>> {
    await this.helpers.validateOrRejectModel(blogData, CreateBlogDto);
    const newBlog: BlogDbType = {
      _id: new ObjectId(),
      name: blogData.name,
      description: blogData.description,
      websiteUrl: blogData.websiteUrl,
      createdAt: new Date(),
      isMembership: false,
    };
    const createdBlogId = await this.blogRepository.createBlog(newBlog);
    if (!createdBlogId) {
      return {
        data: null,
        resultCode: ResultCode.BadRequest,
        message: 'couldn`t create a new blog',
      };
    }
    return {
      data: createdBlogId,
      resultCode: ResultCode.NoContent,
    };
  }

  async updateBlog(
    blogId: string,
    blogUpdateData: CreateBlogDto,
  ): Promise<ResultObject<string>> {
    await this.helpers.validateOrRejectModel(blogUpdateData, CreateBlogDto);

    const isExistBlog = await this.blogQueryRepository.findBlogById(blogId);
    if (!isExistBlog) {
      return {
        data: null,
        resultCode: ResultCode.NotFound,
        message: 'couldn`t find blog',
      };
    }
    const updateBlog = await this.blogRepository.updateBlog(
      blogId,
      blogUpdateData,
    );
    if (!updateBlog) {
      return {
        data: null,
        resultCode: ResultCode.BadRequest,
        message: 'couldn`t update blog',
      };
    }
    return {
      data: blogId,
      resultCode: ResultCode.NoContent,
    };
  }
}
