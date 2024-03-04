import { Model } from 'mongoose';
import { queryDataType } from '../helpers/helpers';
import { ObjectId } from 'mongodb';
import {
  CommentsDBType,
  CommentsDBTypeSqlWithUserLogin,
  CommentsViewModel,
  LikeStatusOption,
  PaginatorCommentViewType,
} from './comments.types';
import { InjectModel } from '@nestjs/mongoose';
import { Comment, CommentDocument } from './comment.schema';
import { LikeStatus, LikeStatusDocument } from '../likeStatus/likeStatus.type';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PostQueryRepositorySql } from '../posts/postQuery.repository.sql';

export class CommentsQueryRepositorySql {
  constructor(
    @InjectModel(Comment.name) public commentModel: Model<CommentDocument>,
    @InjectModel(LikeStatus.name)
    public likeStatusModel: Model<LikeStatusDocument>,
    public postQueryRepository: PostQueryRepositorySql,
    @InjectDataSource() protected dataSource: DataSource,
  ) {}
  async getAllCommentsOfPost(
    postId: string,
    queryData: queryDataType,
    userId?: string | null,
  ): Promise<PaginatorCommentViewType | null> {
    // const filter: FilterQuery<CommentsDBType> = { postId: postId };
    //
    // const comments = await this.commentModel
    //   .find(filter)
    //   .sort({ [queryData.sortBy]: queryData.sortDirection })
    //   .skip(queryData.skippedPages)
    //   .limit(queryData.pageSize)
    //   .lean();

    const isExistPost = await this.postQueryRepository.findPostById(postId);
    if (!isExistPost) return null;

    const comments = await this.dataSource.query(`
        SELECT c.id, content, "postId", "userId", c."createdAt", u.login as "userLogin"
        FROM public."Comments" c
        LEFT JOIN public."Users" u ON u.id = c."userId"
    `);

    const commentViewArray: CommentsViewModel[] = await Promise.all(
      comments.map(async (comment) => {
        return await this.commentsSqlMapping(comment, userId);
      }),
    );
    const pagesCount = await this.countTotalCommentsAndPages(queryData);

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
    userId?: string | null,
  ): Promise<CommentsViewModel | null> {
    // const comment = await this.commentModel.findById(commentId);
    const comment = await this.dataSource.query(
      `
    SELECT c.id, content, "postId", "userId", c."createdAt", u.login as "userLogin"
    FROM public."Comments" c
    LEFT JOIN public."Users" u ON u.id = c."userId"
    WHERE c.id = $1
    `,
      [commentId],
    );
    if (comment[0]) {
      return await this.commentsSqlMapping(comment[0], userId);
    }
    return null;
  }
  private async countTotalCommentsAndPages(queryData: queryDataType) {
    let commentsTotalCount = await this.dataSource.query(`
        SELECT COUNT(*) FROM public."Comments"
    `);
    commentsTotalCount = commentsTotalCount[0]
      ? commentsTotalCount[0].count
      : 0;
    const commentsPagesCount = Math.ceil(
      commentsTotalCount / queryData.pageSize,
    );

    return {
      commentsTotalCount: +commentsTotalCount,
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
  private async commentsSqlMapping(
    comment: CommentsDBTypeSqlWithUserLogin,
    userId?: string | null,
  ): Promise<CommentsViewModel> {
    const commentId = comment.id;

    const queryForLikeStatus = `
        SELECT COUNT(*) FROM
        (SELECT id, "commentId", "userId", "likeStatus", "createdAt"
        FROM public."LikeStatusForComments"
        WHERE "commentId" = $1 AND "likeStatus" = $2)
    `;
    const likesCount: number = (
      await this.dataSource.query(queryForLikeStatus, [commentId, 'Like'])
    )[0].count;
    const dislikesCount: number = (
      await this.dataSource.query(queryForLikeStatus, [commentId, 'Dislike'])
    )[0].count;
    const currentUserId = await this.dataSource.query(
      `
        SELECT id, "commentId", "userId", "likeStatus", "createdAt"
        FROM public."LikeStatusForComments"
        WHERE "userId" = $1
    `,
      [userId],
    );
    let currentStatus;
    if (currentUserId[0]) {
      const result = await this.dataSource.query(
        `
        SELECT id, "commentId", "userId", "likeStatus", "createdAt"
        FROM public."LikeStatusForComments"
        WHERE id = $1 AND "userId" = $2 
    `,
        [commentId, userId],
      );
      currentStatus = result[0] ? result[0].likeStatus : null;
    }

    return {
      id: commentId,
      content: comment.content,
      commentatorInfo: {
        userId: comment.userId,
        userLogin: comment.userLogin,
      },
      createdAt: comment.createdAt,
      likesInfo: {
        likesCount: +likesCount,
        dislikesCount: +dislikesCount,
        myStatus: currentStatus ? currentStatus : LikeStatusOption.None,
      },
    };
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
