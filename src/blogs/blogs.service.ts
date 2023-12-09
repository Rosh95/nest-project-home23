import { Injectable } from '@nestjs/common';
import { BlogRepository } from './blog.repository';
import { BlogQueryRepository } from './blogQuery.repository';
import { BlogDbType, BlogViewType, CreateBlogDto } from './blogs.types';
import { ObjectId } from 'mongodb';
import { Helpers } from '../helpers/helpers';

@Injectable()
export class BlogService {
  constructor(
    protected blogQueryRepository: BlogQueryRepository,
    protected blogRepository: BlogRepository,
    public helpers: Helpers,
  ) {}

  async deleteBlog(blogId: string): Promise<boolean | null> {
    const isExistBlog = await this.blogQueryRepository.findBlogById(blogId);
    if (!isExistBlog) return null;

    return await this.blogRepository.deleteBlog(blogId);
  }

  async createBlog(blogData: CreateBlogDto): Promise<BlogViewType> {
    await this.helpers.validateOrRejectModel(blogData, CreateBlogDto);
    const newBlog: BlogDbType = {
      _id: new ObjectId(),
      name: blogData.name,
      description: blogData.description,
      websiteUrl: blogData.websiteUrl,
      createdAt: new Date(),
      isMembership: false,
    };
    return await this.blogRepository.createBlog(newBlog);
  }

  async updateBlog(
    blogId: string,
    blogUpdateData: CreateBlogDto,
  ): Promise<boolean | null> {
    await this.helpers.validateOrRejectModel(blogUpdateData, CreateBlogDto);
    const isExistBlog = await this.blogQueryRepository.findBlogById(blogId);
    if (!isExistBlog) return null;
    return await this.blogRepository.updateBlog(blogId, blogUpdateData);
  }
}
