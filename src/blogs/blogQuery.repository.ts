import { Injectable } from '@nestjs/common';
import { BlogDbType, BlogViewType } from './blogs.types';
import { newPaginatorViewType, queryDataType } from '../helpers/helpers';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogDocument } from './blog.schema';
import { Post, PostDocument } from '../posts/post.schema';

@Injectable()
export class BlogQueryRepository {
  constructor(
    @InjectModel(Blog.name) public blogModel: Model<BlogDocument>,
    @InjectModel(Post.name) public postModel: Model<PostDocument>,
  ) {}

  async getAllBlogs(
    queryData: queryDataType,
  ): Promise<newPaginatorViewType<BlogViewType>> {
    const filter = {
      name: { $regex: queryData.searchNameTerm, $options: 'i' },
    };
    console.log('blogs');
    console.log(queryData);
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
      _id: new Types.ObjectId(id),
    });
    if (foundBlog) {
      return await this.blogMapping(foundBlog);
    }
    return null;
    // if (foundBlog) {
    //   const result: ResultObject<BlogViewType> = {
    //     data: await this.blogMapping(foundBlog),
    //     resultCode: ResultCode.Created,
    //   };
    //   return result;
    // }
    // const errorInfo: ResultObject<BlogViewType> = {
    //   data: null,
    //   resultCode: ResultCode.BadRequest,
    // };
    // return errorInfo;
  }

  // async getAllPostOfBlog(
  //   blogId: string,
  //   queryData: queryDataType,
  //   userId?: ObjectId | null,
  // ): Promise<PaginatorPostViewType> {
  //   const posts = await this.postModel
  //     .find({ blogId })
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

  async getAllBlogsCount(filter: any): Promise<number> {
    return this.blogModel.countDocuments(filter);
  }

  async getAllPostsCount(): Promise<number> {
    return this.postModel.countDocuments();
  }
}
