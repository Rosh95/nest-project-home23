import { Injectable } from '@nestjs/common';
import { BlogRepository } from './blog.repository';
import { BlogQueryRepository } from './blogQuery.repository';
import { BlogDbType, BlogInputModel, BlogViewType } from './blogs.types';
import { ObjectId } from 'mongodb';

@Injectable()
export class BlogService {
  constructor(
    protected blogQueryRepository: BlogQueryRepository,
    protected blogRepository: BlogRepository,
  ) {}

  async deleteBlog(id: string): Promise<boolean> {
    return await this.blogRepository.deleteBlog(id);
  }

  async createBlog(blogData: BlogInputModel): Promise<BlogViewType> {
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
    blogUpdateData: BlogInputModel,
  ): Promise<boolean> {
    return await this.blogRepository.updateBlog(blogId, blogUpdateData);
  }
}
