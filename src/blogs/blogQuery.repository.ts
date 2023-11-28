import { Injectable, Post } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { BlogDbType, BlogViewType, PaginatorBlogViewType } from './blogs.types';
import { queryDataType } from '../helpers/helpers';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogDocument } from './blog.schema';
import { PostDocument } from '../posts/post.schema';

@Injectable()
export class BlogQueryRepository {
  constructor(
    @InjectModel(Blog.name) public blogModel: Model<BlogDocument>,
    @InjectModel(Post.name) public postModel: Model<PostDocument>,
  ) {}
  async getAllBlogs(queryData: queryDataType): Promise<PaginatorBlogViewType> {
    const filter = {
      name: { $regex: queryData.searchNameTerm, $options: 'i' },
    };

    const blogs = await this.blogModel
      .find(filter)
      .sort({ [queryData.sortBy]: queryData.sortDirection })
      .skip(queryData.skippedPages)
      .limit(queryData.pageSize)
      .lean();

    const blogViewArray = await Promise.all(
      blogs.map((blog: BlogDbType) => this.blogMapping(blog)),
    );
    const pagesCount = await this.countTotalBlogsAndPages(queryData, filter);

    return {
      pagesCount: pagesCount.blogsPagesCount,
      page: queryData.pageNumber,
      pageSize: queryData.pageSize,
      totalCount: pagesCount.blogsTotalCount,
      items: blogViewArray,
    };
  }
  private async blogMapping(blog: BlogDbType): Promise<BlogViewType> {
    const blogMongoId = blog._id.toString();

    return {
      id: blogMongoId,
      name: blog.name,
      description: blog.description,
      websiteUrl: blog.websiteUrl,
      createdAt: blog.createdAt.toISOString(),
      isMembership: blog.isMembership,
    };
  }

  private async countTotalBlogsAndPages(queryData: queryDataType, filter: any) {
    const blogsTotalCount = await this.getAllBlogsCount(filter);
    const blogsPagesCount = Math.ceil(blogsTotalCount / queryData.pageSize);

    return {
      blogsTotalCount,
      blogsPagesCount,
    };
  }
  async findBlogById(id: string): Promise<BlogViewType | null> {
    const foundBlog: BlogDbType | null = await this.blogModel.findOne({
      _id: new ObjectId(id),
    });
    return foundBlog ? this.blogMapping(foundBlog) : null;
  }

  // async getAllPostOfBlog(
  //   blogId: string,
  //   queryData: queryDataType,
  //   userId?: ObjectId | null,
  // ): Promise<PaginatorPostViewType> {
  //   const posts = await PostModel.find({ blogId })
  //     .sort({ [queryData.sortBy]: queryData.sortDirection })
  //     .skip(queryData.skippedPages)
  //     .limit(queryData.pageSize)
  //     .lean();
  //
  //   const postViewArray: PostViewModel[] = await Promise.all(
  //     posts.map(async (post) => postMapping(post, userId)),
  //   );
  //   const pagesCount = await this.countTotalPostsAndPagesOfBlog(
  //     blogId,
  //     queryData,
  //   );
  //
  //   return {
  //     pagesCount: pagesCount.postsPagesCount,
  //     page: queryData.pageNumber,
  //     pageSize: queryData.pageSize,
  //     totalCount: pagesCount.postsTotalCount,
  //     items: postViewArray,
  //   };
  // }
  private async countTotalPostsAndPagesOfBlog(
    id: string,
    queryData: queryDataType,
  ) {
    const postsTotalCount = await this.getAllPostCountOfBlog(id);
    const postsPagesCount = Math.ceil(postsTotalCount / queryData.pageSize);

    return {
      postsTotalCount,
      postsPagesCount,
    };
  }
  async getAllPostCountOfBlog(blogId: string): Promise<number> {
    return this.postModel.countDocuments({ blogId: blogId });
  }

  async getAllBlogsCount(filter: any): Promise<number> {
    return this.blogModel.countDocuments(filter);
  }

  async getAllPostsCount(): Promise<number> {
    return this.postModel.countDocuments();
  }
}