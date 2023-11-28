import { ObjectId } from 'mongodb';
import { CommentsDBType, LikeStatusOption } from './comments.types';
import {
  LikeStatus,
  LikeStatusDBType,
  LikeStatusDocument,
} from '../likeStatus/likeStatus.type';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comment, CommentDocument } from './comment.schema';

export class CommentsRepository {
  constructor(
    @InjectModel(Comment.name) public commentModel: Model<CommentDocument>,
    @InjectModel(LikeStatus.name)
    public likeStatusModel: Model<LikeStatusDocument>,
  ) {}

  async createCommentForPost(newComment: CommentsDBType): Promise<ObjectId> {
    const result = await this.commentModel.create(newComment);
    return result._id;
  }

  async getCommentById(commentId: string): Promise<CommentsDBType | null> {
    const comment = await this.commentModel.findById(commentId);
    if (comment) {
      return comment;
    }
    return null;
  }

  async deleteCommentById(commentId: string) {
    const result = await this.commentModel.deleteOne({
      _id: new ObjectId(commentId),
    });
    console.log(result);
    return result.deletedCount === 1;
  }

  async updatedCommentById(commentId: string, commentContent: string) {
    await this.commentModel.findByIdAndUpdate(commentId, {
      $set: {
        content: commentContent,
      },
    });
    return true;
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

  async createLikeStatus(
    entityId: ObjectId,
    userId: ObjectId,
    userLogin: string,
    likeStatus: LikeStatusOption,
  ) {
    const newLikeStatus: LikeStatusDBType = {
      entityId: entityId.toString(),
      userId: userId.toString(),
      userLogin,
      likeStatus,
      createdAt: new Date(),
    };
    await this.likeStatusModel.create(newLikeStatus);
    return true;
  }

  async updateLikeStatus(
    entityId: ObjectId,
    userId: ObjectId,
    likeStatus: LikeStatusOption,
  ) {
    // const newLikeStatus: LikeStatusDBType = {
    //     entityId: entityId.toString(),
    //     userId: userId.toString(),
    //     userLogin,
    //     likeStatus,
    //     createdAt: new Date()
    // }
    await this.likeStatusModel.findOneAndUpdate(
      { entityId, userId },
      {
        $set: {
          likeStatus: likeStatus,
        },
      },
    );
    return true;
  }
}
