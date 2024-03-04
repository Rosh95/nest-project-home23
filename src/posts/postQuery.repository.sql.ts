import { Injectable } from '@nestjs/common';
import { ObjectId } from 'mongodb';

import { queryDataType } from '../helpers/helpers';
import {
  PaginatorPostViewType,
  PostDBModel,
  PostDBModelSql,
  PostViewModel,
} from './post.types';
import { LikeStatusOption } from '../comments/comments.types';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LikeStatus, LikeStatusDocument } from '../likeStatus/likeStatus.type';
import { Post, PostDocument } from './post.schema';
import { BlogQueryRepositorySql } from '../blogs/blogQuery.repository.sql';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class PostQueryRepositorySql {
  constructor(
    @InjectModel(Post.name) public postModel: Model<PostDocument>,
    @InjectModel(LikeStatus.name)
    public likeStatusModel: Model<LikeStatusDocument>,
    public blogQueryRepository: BlogQueryRepositorySql,
    @InjectDataSource() protected dataSource: DataSource,
  ) {}

  async getAllPosts(
    queryData: queryDataType,
    userId?: string | null,
  ): Promise<PaginatorPostViewType> {
    const sortBy = [
      'id',
      'title',
      'shortDescription',
      'content',
      'blogId',
      'blogName',
      'createdAt',
    ].includes(queryData.sortBy)
      ? queryData.sortBy
      : 'createdAt';
    const sortDirection = queryData.sortDirection === 1 ? 'asc' : 'desc';
    const query = `
    SELECT p.id, title, "shortDescription", content, "blogId", b."name" as "blogName",  p."createdAt"
    FROM public."Posts" p
    LEFT JOIN public."Blogs" b ON b.id = p."blogId"
    ORDER BY "${sortBy}" ${sortDirection}
    LIMIT $1 OFFSET $2
    `;
    const postData: PostDBModelSql[] = await this.dataSource.query(query, [
      `${queryData.pageSize}`,
      `${queryData.skippedPages}`,
    ]);
    const postViewArray: PostViewModel[] = await Promise.all(
      postData.map(async (post) => this.postMappingSql(post, userId)),
    );
    const pagesCount = await this.countTotalPostsAndPages(queryData);

    return {
      pagesCount: pagesCount.postsPagesCount,
      page: queryData.pageNumber,
      pageSize: queryData.pageSize,
      totalCount: pagesCount.postsTotalCount,
      items: postViewArray,
    };
  }
  private async countTotalPostsAndPages(queryData: queryDataType) {
    const postsTotalCount = await this.getAllPostsCount();
    const postsPagesCount = Math.ceil(postsTotalCount / queryData.pageSize);

    return {
      postsTotalCount: +postsTotalCount,
      postsPagesCount: +postsPagesCount,
    };
  }
  async getAllPostsCount(): Promise<number> {
    const countPages = await this.dataSource.query(`
    SELECT COUNT(*) FROM public."Posts"
    `);
    return countPages[0].count;
  }
  async findPostById(
    id: string,
    userId?: string | null,
  ): Promise<PostViewModel | null> {
    const foundPost = await this.dataSource.query(
      `
        SELECT id, title, "shortDescription", content, "blogId", "createdAt"
        FROM public."Posts"
        WHERE id = $1
    `,
      [id],
    );

    return foundPost[0] ? this.postMappingSql(foundPost[0], userId) : null;
  }
  async getAllPostOfBlog(
    blogId: string,
    queryData: queryDataType,
    userId?: string | null,
  ): Promise<PaginatorPostViewType | null> {
    const isExistBlog = await this.blogQueryRepository.findBlogById(blogId);
    if (!isExistBlog) return null;

    const sortBy = [
      'id',
      'title',
      'shortDescription',
      'content',
      'blogId',
      'createdAt',
    ].includes(queryData.sortBy)
      ? queryData.sortBy
      : 'createdAt';
    const sortDirection = queryData.sortDirection === 1 ? 'asc' : 'desc';
    const query = `
    SELECT id, title, "shortDescription", content, "blogId", "createdAt"
    FROM public."Posts"
    ORDER BY "${sortBy}" ${sortDirection}
    LIMIT $1 OFFSET $2
    `;
    const postData: PostDBModelSql[] = await this.dataSource.query(query, [
      `${queryData.pageSize}`,
      `${queryData.skippedPages}`,
    ]);
    const postViewArray: PostViewModel[] = await Promise.all(
      postData.map(async (post) => this.postMappingSql(post, userId)),
    );

    // const posts = await this.postModel
    //   .find({ blogId })
    //   .sort({ [queryData.sortBy]: queryData.sortDirection })
    //   .skip(queryData.skippedPages)
    //   .limit(queryData.pageSize)
    //   .lean();
    // const postViewArray: PostViewModel[] = await Promise.all(
    //   posts.map(async (post) => this.postMapping(post, userId)),
    // );

    const pagesCount = await this.countTotalPostsAndPagesOfBlog(
      blogId,
      queryData,
    );

    return {
      pagesCount: pagesCount.postsPagesCount,
      page: queryData.pageNumber,
      pageSize: queryData.pageSize,
      totalCount: pagesCount.postsTotalCount,
      items: postViewArray,
    };
  }

  private async countTotalPostsAndPagesOfBlog(
    blogId: string,
    queryData: queryDataType,
  ) {
    const postsTotalCount = await this.getAllPostCountOfBlog(blogId);
    const postsPagesCount = Math.ceil(postsTotalCount / queryData.pageSize);
    return {
      postsTotalCount: +postsTotalCount,
      postsPagesCount,
    };
  }
  async getAllPostCountOfBlog(blogId: string): Promise<number> {
    const query = `
    SELECT COUNT(*) FROM public."Posts"
    WHERE "blogId" = '${blogId}'
    `;
    const blogsData = await this.dataSource.query(query);
    return blogsData[0].count;

    // return this.postModel.countDocuments({ blogId: blogId });
  }

  private async postMappingSql(
    post: PostDBModelSql,
    userId?: string | null,
  ): Promise<PostViewModel> {
    const postId = post.id;
    const queryForLikeStatus = `
        SELECT COUNT(*) FROM
        (SELECT id, "postId", "userId", "likeStatus", "createdAt"
        FROM public."LikeStatusForPosts"
        WHERE "postId" = $1 AND "likeStatus" = $2)
    `;

    const likesCount: number = (
      await this.dataSource.query(queryForLikeStatus, [postId, 'Like'])
    )[0].count;
    const dislikesCount: number = (
      await this.dataSource.query(queryForLikeStatus, [postId, 'Dislike'])
    )[0].count;
    const currentUserId = await this.dataSource.query(
      `
        SELECT id, "postId", "userId", "likeStatus", "createdAt"
        FROM public."LikeStatusForPosts"
        WHERE "userId" = $1
    `,
      [userId],
    );
    let currentStatus;
    if (currentUserId[0]) {
      const result = await this.dataSource.query(
        `
        SELECT id, "postId", "userId", "likeStatus", "createdAt"
        FROM public."LikeStatusForPosts"
        WHERE "postId" = $1 AND "userId" = $2 
    `,
        [postId, userId],
      );

      currentStatus = result[0] ? result[0].likeStatus : null;
    }
    const blogName = await this.blogQueryRepository.findBlogById(post.blogId);

    const newestLikesFromDb = await this.dataSource.query(
      `
        SELECT ls."id", "postId", "userId", "likeStatus", ls."createdAt", u.login
        FROM public."LikeStatusForPosts" as ls
        LEFT JOIN public."Users" as u ON u."id" = ls."userId"
        WHERE "postId" = $1 AND "likeStatus" = $2
        ORDER BY "createdAt" DESC
        LIMIT 3 
    `,
      [postId, 'Like'],
    );
    const newestLikes = newestLikesFromDb.map((value) => {
      return {
        addedAt: value.createdAt,
        userId: value.userId,
        login: value.login,
      };
    });

    return {
      id: postId,
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId,
      blogName: blogName!.name,
      createdAt: post.createdAt,
      extendedLikesInfo: {
        likesCount: +likesCount,
        dislikesCount: +dislikesCount,
        myStatus: currentStatus ? currentStatus : LikeStatusOption.None,
        newestLikes: newestLikes,
      },
    };
  }

  private async postMapping(
    post: PostDBModel,
    userId?: ObjectId | null,
  ): Promise<PostViewModel> {
    const postMongoId = post._id.toString();

    const likesCount: number = await this.likeStatusModel.countDocuments({
      entityId: postMongoId,
      likeStatus: 'Like',
    });
    const dislikesCount: number = await this.likeStatusModel.countDocuments({
      entityId: postMongoId,
      likeStatus: 'Dislike',
    });

    const currentUserId = await this.likeStatusModel.findOne({
      entityId: postMongoId,
      userId,
    });
    let currentStatus;
    if (currentUserId) {
      const result = await this.likeStatusModel.findOne({
        entityId: postMongoId,
        userId,
      });
      currentStatus = result ? result.likeStatus : null;
    }
    const newestLikesFromDb = await this.likeStatusModel
      .find({
        entityId: postMongoId,
        likeStatus: LikeStatusOption.Like,
      })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    const newestLikes = newestLikesFromDb.map((value) => {
      return {
        addedAt: value.createdAt.toISOString(),
        userId: value.userId.toString(),
        login: value.userLogin,
      };
    });

    return {
      id: postMongoId,
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId,
      blogName: post.blogName,
      createdAt: post.createdAt.toISOString(),
      extendedLikesInfo: {
        likesCount: likesCount,
        dislikesCount: dislikesCount,
        myStatus: currentStatus ? currentStatus : LikeStatusOption.None,
        newestLikes: newestLikes,
      },
    };
  }
}
