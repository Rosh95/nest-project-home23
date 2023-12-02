import { Injectable } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { BlogDbType, BlogInputModel, BlogViewType } from './blogs.types';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Blog, BlogDocument } from './blog.schema';

@Injectable()
export class BlogRepository {
  constructor(@InjectModel(Blog.name) public blogModel: Model<Blog>) {}

  async deleteBlog(id: string): Promise<boolean> {
    const result = await this.blogModel.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount === 1;
  }
  async createBlog(newBlog: BlogDbType): Promise<BlogViewType> {
    const result: BlogDocument = await this.blogModel.create(newBlog);
    return {
      id: result.id,
      name: newBlog.name,
      description: newBlog.description,
      websiteUrl: newBlog.websiteUrl,
      createdAt: newBlog.createdAt.toISOString(),
      isMembership: newBlog.isMembership,
    };
  }
  async updateBlog(
    blogId: string,
    blogUpdateData: BlogInputModel,
  ): Promise<boolean> {
    const result = await this.blogModel.updateOne(
      { _id: new ObjectId(blogId) },
      {
        $set: {
          name: blogUpdateData.name,
          description: blogUpdateData.description,
          websiteUrl: blogUpdateData.websiteUrl,
        },
      },
    );
    return result.matchedCount === 1;
  }
}
