import { Injectable } from '@nestjs/common';
import { LikeStatusOption } from './comments.types';
import { CommentsQueryRepository } from './commentsQuery.repository';
import { CommentsRepository } from './comments.repository';
import {
  LikeStatus,
  LikeStatusDBType,
  LikeStatusDocument,
} from '../likeStatus/likeStatus.type';
import { Model, Types } from 'mongoose';
import { PostQueryRepository } from '../posts/postQuery.repository';
import { UsersQueryRepository } from '../users/usersQuery.repository';
import { InjectModel } from '@nestjs/mongoose';
import { ResultCode, ResultObject } from '../helpers/heplersType';

@Injectable()
export class CommentsService {
  constructor(
    public commentRepository: CommentsRepository,
    public commentQueryRepository: CommentsQueryRepository,
    public postQueryRepository: PostQueryRepository,
    public usersRepository: UsersQueryRepository,
    @InjectModel(LikeStatus.name)
    public likeStatusModel: Model<LikeStatusDocument>,
  ) {}

  // async sendComment(comment: string, id: ObjectId | string) {
  //   return null;
  // }
  //
  // async allFeedback(comment: string, userId: ObjectId) {
  //   return this.commentQueryRepository.getAllComments();
  // }

  async getCommentById(commentId: string) {
    return this.commentRepository.getCommentById(commentId);
  }

  // async deleteCommentById(commentId: string) {
  //   const commentInfo =
  //     await this.commentQueryRepository.getCommentById(commentId);
  //   if (!commentInfo) return null;
  //   return await this.commentRepository.deleteCommentById(commentId);
  // }

  // async createCommentForPost(
  //   postId: string,
  //   currentUser: getUserViewModel,
  //   content: string,
  // ): Promise<ResultObject<string>> {
  //   const currentPost: PostViewModel | null =
  //     await this.postQueryRepository.findPostById(postId.toString());
  //   if (!currentPost) {
  //     return {
  //       data: null,
  //       resultCode: ResultCode.NotFound,
  //       message: 'couldn`t find blog',
  //     };
  //   }
  //   const newComment: CommentsDBType = {
  //     _id: new ObjectId(),
  //     content: content,
  //     commentatorInfo: {
  //       userId: new Types.ObjectId(currentUser.id).toString(),
  //       userLogin: currentUser.login,
  //     },
  //     postId: postId,
  //     createdAt: new Date(),
  //     likesInfo: {
  //       likesCount: 0,
  //       dislikesCount: 0,
  //       myStatus: LikeStatusOption.None,
  //     },
  //   };
  //   const resultId = this.commentRepository.createCommentForPost(newComment);
  //   if (!resultId) {
  //     return {
  //       data: null,
  //       resultCode: ResultCode.BadRequest,
  //       message: 'couldn`t comment post',
  //     };
  //   }
  //
  //   return {
  //     data: resultId.toString(),
  //     resultCode: ResultCode.NoContent,
  //   };
  // }

  // async updateCommentById(
  //   commentId: string,
  //   commentContent: string,
  //   userId: string,
  // ) {
  //   const commentInfo =
  //     await this.commentQueryRepository.getCommentById(commentId);
  //   if (!commentInfo) return null;
  //   if (commentInfo?.commentatorInfo.userId !== userId) {
  //     throw new ForbiddenException();
  //   }
  //   return this.commentRepository.updatedCommentById(commentId, commentContent);
  // }

  async updateCommentLikeStatusById(
    commentId: string,
    newLikeStatusForComment: LikeStatusOption,
    userId: string,
  ): Promise<ResultObject<string>> {
    const commentInfo =
      await this.commentQueryRepository.getCommentById(commentId);
    if (!commentInfo)
      return {
        data: null,
        resultCode: ResultCode.NotFound,
        message: 'couldn`t find comment',
      };
    const currentUser = await this.usersRepository.findUserById(userId);
    const findLikeStatusInDB: LikeStatusDBType | null =
      await this.likeStatusModel.findOne({
        entityId: commentInfo.id,
        userId: userId,
      });

    if (!findLikeStatusInDB) {
      await this.commentRepository.createLikeStatus(
        new Types.ObjectId(commentInfo.id),
        new Types.ObjectId(currentUser!.id),
        currentUser!.login,
        newLikeStatusForComment,
      );
      return {
        data: 'ok',
        resultCode: ResultCode.NoContent,
      };
    }
    await this.commentRepository.updateLikeStatus(
      new Types.ObjectId(commentInfo.id),
      new Types.ObjectId(currentUser!.id),
      newLikeStatusForComment,
    );

    //findLikeStatusInDB.likeStatus = newLikeStatusForComment;

    return {
      data: 'ok',
      resultCode: ResultCode.NoContent,
    };
    // return commentRepository.updatedCommentLikeStatusById(commentInfo._id.toString(), newLikeStatusForComment)
  }
}
