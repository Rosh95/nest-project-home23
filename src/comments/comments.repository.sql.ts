import {
  CommentsDBTypeSqlWithUserLogin,
  InputCommentsDBTypeSql,
  LikeStatusOption,
} from './comments.types';
import { LikeStatus, LikeStatusDocument } from '../likeStatus/likeStatus.type';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comment, CommentDocument } from './comment.schema';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export class CommentsRepositorySql {
  constructor(
    @InjectModel(Comment.name) public commentModel: Model<CommentDocument>,
    @InjectModel(LikeStatus.name)
    public likeStatusModel: Model<LikeStatusDocument>,
    @InjectDataSource() protected dataSource: DataSource,
  ) {}

  async createCommentForPost(
    newComment: InputCommentsDBTypeSql,
  ): Promise<string> {
    const createdCommentId = await this.dataSource.query(
      `
    INSERT INTO public."Comments"(
     content, "postId", "userId")
    VALUES ($1, $2, $3)    
    RETURNING *
    `,
      [newComment.content, newComment.postId, newComment.userId],
    );
    return createdCommentId[0].id ? createdCommentId[0].id : null;

    // const createdComment = await this.dataSource.query(
    //   `
    //   SELECT id, content, "postId", "userId", "createdAt"
    //   FROM public."Comments"
    //   WHERE  content = $1 AND "postId" = $2 AND "userId" =$3
    // `,
    //   [newComment.content, newComment.postId, newComment.userId],
    // );
    // return createdComment[0].id;
    // const result = await this.commentModel.create(newComment);
    // return result._id;
  }

  async getCommentById(
    commentId: string,
  ): Promise<CommentsDBTypeSqlWithUserLogin | null> {
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
      return comment[0];
    }
    return null;
  }

  async deleteCommentById(commentId: string) {
    const deletedComment = await this.dataSource.query(
      `
      DELETE FROM public."Comments"
      WHERE id = $1
      RETURNING *
    `,
      [commentId],
    );
    return !!deletedComment[0];

    // const result = await this.commentModel.deleteOne({
    //   _id: new ObjectId(commentId),
    // });
    // console.log(result);
    // return result.deletedCount === 1;
  }

  async updatedCommentById(commentId: string, commentContent: string) {
    const updatedComment = await this.dataSource.query(
      `
      UPDATE public."Comments"
      SET content = $1
      WHERE id = $2
      RETURNING *
     `,
      [commentContent, commentId],
    );
    return !!updatedComment[0];
    // await this.commentModel.findByIdAndUpdate(commentId, {
    //   $set: {
    //     content: commentContent,
    //   },
    // });
    // return true;
  }

  // async updatedCommentLikeStatusById(commentId: string, likeStatus: string) {
  //   const commentInfo = await commentQueryRepository.getCommentById(commentId);
  //
  //   const result = await CommentModel.findByIdAndUpdate(commentId, {
  //     $set: {
  //       'likesInfo.myStatus': likeStatus,
  //     },
  //   });
  //   return true;
  // }

  async findLikeStatusForComment(
    commentId: string,
    userId: string,
  ): Promise<boolean> {
    const foundLikeStatus = await this.dataSource.query(
      `
      SELECT id, "commentId", "userId", "likeStatus", "createdAt"
      FROM public."LikeStatusForComments"
      WHERE "commentId" = $1  AND "userId" = $2
    `,
      [commentId, userId],
    );
    console.log(foundLikeStatus[0]);
    return !!foundLikeStatus[0];
  }
  async createLikeStatusForComment(
    commentId: string,
    userId: string,
    likeStatus: LikeStatusOption,
  ) {
    const createdLikeStatusForPost = await this.dataSource.query(
      `
    INSERT INTO public."LikeStatusForComments"(
     "commentId", "userId", "likeStatus")
    VALUES ($1, $2, $3)
    RETURNING *    
    `,
      [commentId, userId, likeStatus],
    );
    return !!createdLikeStatusForPost[0];
  }

  async updateLikeStatusForComments(
    commentId: string,
    userId: string,
    likeStatus: LikeStatusOption,
  ) {
    const updatedLikeStatus = await this.dataSource.query(
      `
      UPDATE public."LikeStatusForComments"
      SET  "likeStatus"= $3
      WHERE "commentId" = $1 AND "userId" = $2 
      RETURNING *    
    `,
      [commentId, userId, likeStatus],
    );
    return !!updatedLikeStatus[0];
  }
}
