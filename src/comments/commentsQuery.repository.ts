import { FilterQuery, Model } from 'mongoose';
import { queryDataType } from '../helpers/helpers';
import { ObjectId } from 'mongodb';
import {
  CommentsDBType,
  CommentsViewModel,
  LikeStatusOption,
  PaginatorCommentViewType,
} from './comments.types';
import { InjectModel } from '@nestjs/mongoose';
import { Comment, CommentDocument } from './comment.schema';
import { LikeStatus, LikeStatusDocument } from '../likeStatus/likeStatus.type';

export class CommentsQueryRepository {
  constructor(
    @InjectModel(Comment.name) public commentModel: Model<CommentDocument>,
    @InjectModel(LikeStatus.name)
    public likeStatusModel: Model<LikeStatusDocument>,
  ) {}
  async getAllCommentsOfPost(
    postId: string,
    queryData: queryDataType,
    userId?: ObjectId | null,
  ): Promise<PaginatorCommentViewType> {
    const filter: FilterQuery<CommentsDBType> = { postId: postId };

    const comments = await this.commentModel
      .find(filter)
      .sort({ [queryData.sortBy]: queryData.sortDirection })
      .skip(queryData.skippedPages)
      .limit(queryData.pageSize)
      .lean();

    const commentViewArray: CommentsViewModel[] = await Promise.all(
      comments.map(async (comment) => {
        return await this.commentsMapping(comment, userId);
      }),
    );
    const pagesCount = await this.countTotalCommentsAndPages(queryData, filter);

    return {
      pagesCount: pagesCount.commentsPagesCount,
      page: queryData.pageNumber,
      pageSize: queryData.pageSize,
      totalCount: pagesCount.commentsTotalCount,
      items: commentViewArray,
    };
  }

  async getCommentById(
    commentId: string,
    userId?: ObjectId | null,
  ): Promise<CommentsViewModel | null> {
    const comment = await this.commentModel.findById(commentId);
    if (comment) {
      return await this.commentsMapping(comment, userId);
    }
    return null;
  }
  private async countTotalCommentsAndPages(
    queryData: queryDataType,
    filter: any,
  ) {
    const commentsTotalCount = await this.getAllCommentsWithFilter(filter);
    const commentsPagesCount = Math.ceil(
      commentsTotalCount / queryData.pageSize,
    );

    return {
      commentsTotalCount,
      commentsPagesCount,
    };
  }

  async getAllComments(): Promise<CommentsViewModel[]> {
    const comments = await this.commentModel.find({}).lean();
    return Promise.all(
      comments.map((comment) => this.commentsMapping(comment)),
    );
  }

  async getAllCommentsWithFilter(filter: any) {
    return this.commentModel.countDocuments(filter);
  }

  private async commentsMapping(
    comment: CommentsDBType,
    userId?: ObjectId | null,
  ): Promise<CommentsViewModel> {
    const commentMongoId = comment._id.toString();
    const likesCount: number = await this.likeStatusModel.countDocuments({
      entityId: commentMongoId,
      likeStatus: 'Like',
    });
    const dislikesCount: number = await this.likeStatusModel.countDocuments({
      entityId: commentMongoId,
      likeStatus: 'Dislike',
    });
    const currentUserId = await this.likeStatusModel.findOne({
      entityId: commentMongoId,
      userId,
    });
    let currentStatus;
    if (currentUserId) {
      const result = await this.likeStatusModel.findById(currentUserId);
      currentStatus = result ? result.likeStatus : null;
    }

    return {
      id: commentMongoId,
      content: comment.content,
      commentatorInfo: {
        userId: comment.commentatorInfo.userId.toString(),
        userLogin: comment.commentatorInfo.userLogin,
      },
      createdAt: comment.createdAt.toISOString(),
      likesInfo: {
        likesCount: likesCount,
        dislikesCount: dislikesCount,
        myStatus: currentStatus ? currentStatus : LikeStatusOption.None,
      },
    };
  }
}
