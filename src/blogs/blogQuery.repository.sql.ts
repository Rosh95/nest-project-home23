import { Injectable } from '@nestjs/common';
import { BlogDbTypeSql, BlogViewType } from './blogs.types';
import { newPaginatorViewType, queryDataType } from '../helpers/helpers';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogDocument } from './blog.schema';
import { Post, PostDocument } from '../posts/post.schema';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class BlogQueryRepositorySql {
  constructor(
    @InjectModel(Blog.name) public blogModel: Model<BlogDocument>,
    @InjectModel(Post.name) public postModel: Model<PostDocument>,
    @InjectDataSource() protected dataSource: DataSource,
  ) {}

  async getAllBlogs(
    queryData: queryDataType,
  ): Promise<newPaginatorViewType<BlogViewType>> {
    const searchNameTerm = queryData.searchNameTerm;
    //  const sortBy = 'createdAt'; // safe
    const sortBy = [
      'id',
      'name',
      'description',
      'websiteUrl',
      'createdAt',
      'isMembership',
    ].includes(queryData.sortBy)
      ? queryData.sortBy
      : 'createdAt';
    const sortDirection = queryData.sortDirection === 1 ? 'asc' : 'desc';
    const pagesCount = await this.countTotalBlogsAndPages(queryData);
    const query = `
    SELECT  id, name, description, "websiteUrl", "createdAt", "isMembership"
    FROM public."Blogs" u 
    WHERE name ILIKE $1 
    ORDER BY "${sortBy}"  ${sortDirection}
    LIMIT $2 OFFSET $3
    `;
    const blogData: BlogViewType[] = await this.dataSource.query(query, [
      `%${searchNameTerm}%`,
      `${queryData.pageSize}`,
      `${queryData.skippedPages}`,
    ]);
    const blogsViewArray = blogData.map((blog) => this.blogMappingSql(blog));

    return {
      pagesCount: pagesCount.blogsPagesCount,
      page: queryData.pageNumber,
      pageSize: queryData.pageSize,
      totalCount: +pagesCount.blogsTotalCount,
      items: blogsViewArray,
    };

    // const filter = {
    //   name: { $regex: queryData.searchNameTerm, $options: 'i' },
    // };
    // const searchEmailTerm = queryData.searchEmailTerm;
    // const searchLoginTerm = queryData.searchLoginTerm;
    //
    // const blogs = await this.blogModel
    //   .find(filter)
    //   .sort({ [queryData.sortBy]: queryData.sortDirection })
    //   .skip(queryData.skippedPages)
    //   .limit(queryData.pageSize)
    //   .lean();
    //
    // const blogViewArray = await Promise.all(
    //   blogs.map((blog: BlogDbType) => this.blogMapping(blog)),
    // );
    // const pagesCount = await this.countTotalBlogsAndPages(queryData, filter);
    //
    // return {
    //   pagesCount: pagesCount.blogsPagesCount,
    //   page: queryData.pageNumber,
    //   pageSize: queryData.pageSize,
    //   totalCount: pagesCount.blogsTotalCount,
    //   items: blogViewArray,
    // };
  }

  // private async blogMapping(blog: BlogDbType): Promise<BlogViewType> {
  //   return {
  //     id: blog.id,
  //     name: blog.name,
  //     description: blog.description,
  //     websiteUrl: blog.websiteUrl,
  //     createdAt: blog.createdAt.toISOString(),
  //     isMembership: blog.isMembership,
  //   };
  // }
  private blogMappingSql(blog: BlogDbTypeSql): BlogViewType {
    return {
      id: blog.id,
      name: blog.name,
      description: blog.description,
      websiteUrl: blog.websiteUrl,
      createdAt: blog.createdAt,
      isMembership: blog.isMembership,
    };
  }

  private async countTotalBlogsAndPages(queryData: queryDataType) {
    const blogsTotalCount = await this.getAllBlogsCount(queryData);
    const blogsPagesCount = Math.ceil(blogsTotalCount / queryData.pageSize);

    return {
      blogsTotalCount,
      blogsPagesCount,
    };
  }

  async findBlogById(blogId: string): Promise<BlogViewType | null> {
    const foundBlog = await this.dataSource.query(
      `
      SELECT  id, name, description, "websiteUrl", "createdAt", "isMembership"
      FROM public."Blogs"  
      WHERE id = $1 
    `,
      [blogId],
    );

    // const foundBlog: BlogDbType | null = await this.blogModel.findOne({
    //   _id: new Types.ObjectId(id),
    // });
    if (foundBlog[0]) {
      return this.blogMappingSql(foundBlog[0]);
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

  async getAllBlogsCount(queryData: queryDataType): Promise<number> {
    const query = `
    SELECT COUNT(*) FROM
    (SELECT id, name, description, "websiteUrl", "createdAt"
    FROM public."Blogs" u 
    WHERE name ILIKE $1 
    )
    `;
    const blogsData = await this.dataSource.query(query, [
      `%${queryData.searchNameTerm}%`,
    ]);
    return blogsData[0].count;
  }

  async getAllPostsCount(): Promise<number> {
    return this.postModel.countDocuments();
  }
}
