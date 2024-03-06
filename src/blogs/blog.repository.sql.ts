import { Injectable } from '@nestjs/common';
import { BlogDbType, BlogInputModel } from './blogs.types';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Blog } from './blog.schema';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class BlogRepositorySql {
  constructor(
    @InjectModel(Blog.name) public blogModel: Model<Blog>,
    @InjectDataSource() protected dataSource: DataSource,
  ) {}

  async deleteBlog(id: string): Promise<boolean> {
    const query = `
    DELETE FROM public."Blogs"
    WHERE id = $1 
    `;
    const blogsData = await this.dataSource.query(query, [id]);
    return blogsData[1] === 1;

    // const result = await this.blogModel.deleteOne({ _id: new ObjectId(id) });
    // return result.deletedCount === 1;
  }
  async createBlog(newBlog: BlogDbType): Promise<string | null> {
    const query = `
  INSERT INTO public."Blogs"(
   name, description, "websiteUrl", "isMembership")
  VALUES ( $1, $2, $3, $4);
    `;
    await this.dataSource.query(query, [
      newBlog.name,
      newBlog.description,
      newBlog.websiteUrl,
      newBlog.isMembership,
    ]);

    const queryDataForNewPostBlog = `
    SELECT *   FROM public."Blogs" u 
    WHERE name = $1 AND description = $2
    `;
    const blogData = await this.dataSource.query(queryDataForNewPostBlog, [
      newBlog.name,
      newBlog.description,
    ]);
    if (blogData[0]) {
      return blogData[0].id;
    }
    return null;

    // const result: BlogDocument = await this.blogModel.create(newBlog);
    //
    // return result._id.toString();
    // return {
    //   id: result.id,
    //   name: newBlog.name,
    //   description: newBlog.description,
    //   websiteUrl: newBlog.websiteUrl,
    //   createdAt: newBlog.createdAt.toISOString(),
    //   isMembership: newBlog.isMembership,
    // };
  }
  async updateBlog(
    blogId: string,
    blogUpdateData: BlogInputModel,
  ): Promise<boolean> {
    const updatedBlog = await this.dataSource.query(
      `
    UPDATE public."Blogs"
    SET  name= $2, description= $3, "websiteUrl"= $4
    WHERE id = $1
    RETURNING *
    `,
      [
        blogId,
        blogUpdateData.name,
        blogUpdateData.description,
        blogUpdateData.websiteUrl,
      ],
    );
    return updatedBlog[0] ? true : false;

    // const result = await this.blogModel.updateOne(
    //   { _id: new ObjectId(blogId) },
    //   {
    //     $set: {
    //       name: blogUpdateData.name,
    //       description: blogUpdateData.description,
    //       websiteUrl: blogUpdateData.websiteUrl,
    //     },
    //   },
    // );
    // return result.matchedCount === 1;
  }
}
