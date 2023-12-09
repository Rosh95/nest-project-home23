import { ForbiddenException, Injectable } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { getUserViewModel } from '../users/user.types';
import {
  CommentsDBType,
  CommentsInputData,
  LikeStatusOption,
} from './comments.types';
import { LikeStatusModel } from '../db/dbMongo';
import { CommentsQueryRepository } from './commentsQuery.repository';
import { CommentsRepository } from './comments.repository';
import { LikeStatusDBType } from '../likeStatus/likeStatus.type';
import { Types } from 'mongoose';
import { PostViewModel } from '../posts/post.types';
import { PostQueryRepository } from '../posts/postQuery.repository';
import { UsersQueryRepository } from '../users/usersQuery.repository';

@Injectable()
export class CommentsService {
  constructor(
    public commentRepository: CommentsRepository,
    public commentQueryRepository: CommentsQueryRepository,
    public postQueryRepository: PostQueryRepository,
    public usersRepostory: UsersQueryRepository,
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

  async deleteCommentById(commentId: string) {
    const commentInfo =
      await this.commentQueryRepository.getCommentById(commentId);
    if (!commentInfo) return null;
    return await this.commentRepository.deleteCommentById(commentId);
  }

  async createCommentForPost(
    postId: string,
    currentUser: getUserViewModel | null,
    content: string,
  ): Promise<ObjectId | null> {
    const currentPost: PostViewModel | null =
      await this.postQueryRepository.findPostById(postId.toString());
    if (!currentPost) return null;

    const newCommentData: CommentsInputData = {
      content: content,
      userId: new Types.ObjectId(currentUser!.id),
      userLogin: currentUser!.login,
      postId: postId.toString(),
    };

    const newComment: CommentsDBType = {
      _id: new ObjectId(),
      content: newCommentData.content,
      commentatorInfo: {
        userId: newCommentData.userId.toString(),
        userLogin: newCommentData.userLogin,
      },
      postId: newCommentData.postId,
      createdAt: new Date(),
      likesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: LikeStatusOption.None,
      },
    };
    return this.commentRepository.createCommentForPost(newComment);
  }

  async updateCommentById(
    commentId: string,
    commentContent: string,
    userId: string,
  ) {
    const commentInfo =
      await this.commentQueryRepository.getCommentById(commentId);
    if (!commentInfo) return null;
    if (commentInfo?.commentatorInfo.userId !== userId) {
      throw new ForbiddenException();
    }
    return this.commentRepository.updatedCommentById(commentId, commentContent);
  }

  async updateCommentLikeStatusById(
    commentId: string,
    newLikeStatusForComment: LikeStatusOption,
    userId: string,
  ) {
    const commentInfo =
      await this.commentQueryRepository.getCommentById(commentId);
    if (!commentInfo) return null;
    const currentUser = await this.usersRepostory.findUserById(userId);
    const findLikeStatusInDB: LikeStatusDBType | null =
      await LikeStatusModel.findOne({
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
      return true;
    }
    await this.commentRepository.updateLikeStatus(
      new Types.ObjectId(commentInfo.id),
      new Types.ObjectId(currentUser!.id),
      newLikeStatusForComment,
    );

    //findLikeStatusInDB.likeStatus = newLikeStatusForComment;

    return true;
    // return commentRepository.updatedCommentLikeStatusById(commentInfo._id.toString(), newLikeStatusForComment)
  }
}
