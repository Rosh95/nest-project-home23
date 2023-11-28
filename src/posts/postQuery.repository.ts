import { Injectable, Post } from '@nestjs/common';
import { ObjectId } from 'mongodb';

import { queryDataType } from '../helpers/helpers';
import {
  PaginatorPostViewType,
  PostDBModel,
  PostViewModel,
} from './post.types';
import { LikeStatusOption } from '../comments/comments.types';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LikeStatus, LikeStatusDocument } from '../likeStatus/likeStatus.type';
import { PostDocument } from './post.schema';

@Injectable()
export class PostQueryRepository {
  constructor(
    @InjectModel(Post.name) public postModel: Model<PostDocument>,
    @InjectModel(LikeStatus.name)
    public likeStatusModel: Model<LikeStatusDocument>,
  ) {}

  async getAllPosts(
    queryData: queryDataType,
    userId?: ObjectId | null,
  ): Promise<PaginatorPostViewType> {
    const posts = await this.postModel
      .find()
      .sort({ [queryData.sortBy]: queryData.sortDirection })
      .skip(queryData.skippedPages)
      .limit(queryData.pageSize)
      .lean();

    const postViewArray: PostViewModel[] = await Promise.all(
      posts.map(async (post) => this.postMapping(post, userId)),
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
      postsTotalCount,
      postsPagesCount,
    };
  }
  async getAllPostsCount(): Promise<number> {
    return this.postModel.countDocuments();
  }
  async findPostById(
    id: string,
    userId?: ObjectId | null,
  ): Promise<PostViewModel | null> {
    const foundPost: PostDBModel = <PostDBModel>(
      await this.postModel.findOne({ _id: new ObjectId(id) })
    );
    return foundPost ? this.postMapping(foundPost, userId) : null;
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
