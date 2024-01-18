import { CommentsRepository } from '../../comments.repository';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentsQueryRepository } from '../../commentsQuery.repository';
import { ResultCode, ResultObject } from '../../../helpers/heplersType';
import { LikeStatusOption } from '../../comments.types';
import {
  LikeStatus,
  LikeStatusDBType,
  LikeStatusDocument,
} from '../../../likeStatus/likeStatus.type';
import { Model, Types } from 'mongoose';
import { UsersQueryRepository } from '../../../users/usersQuery.repository';
import { InjectModel } from '@nestjs/mongoose';

export class UpdateCommentLikeStatusByIdCommand {
  constructor(
    public commentId: string,
    public newLikeStatusForComment: LikeStatusOption,
    public userId: string,
  ) {}
}

@CommandHandler(UpdateCommentLikeStatusByIdCommand)
export class UpdateCommentLikeStatusById
  implements ICommandHandler<UpdateCommentLikeStatusByIdCommand>
{
  constructor(
    public commentRepository: CommentsRepository,
    public commentQueryRepository: CommentsQueryRepository,
    public usersRepository: UsersQueryRepository,
    @InjectModel(LikeStatus.name)
    public likeStatusModel: Model<LikeStatusDocument>,
  ) {}

  async execute(
    command: UpdateCommentLikeStatusByIdCommand,
  ): Promise<ResultObject<string>> {
    const commentInfo = await this.commentQueryRepository.getCommentById(
      command.commentId,
    );
    if (!commentInfo)
      return {
        data: null,
        resultCode: ResultCode.NotFound,
        message: 'couldn`t find comment',
      };
    const currentUser = await this.usersRepository.findUserById(command.userId);
    const findLikeStatusInDB: LikeStatusDBType | null =
      await this.likeStatusModel.findOne({
        entityId: commentInfo.id,
        userId: command.userId,
      });

    if (!findLikeStatusInDB) {
      await this.commentRepository.createLikeStatus(
        new Types.ObjectId(commentInfo.id),
        new Types.ObjectId(currentUser!.id),
        currentUser!.login,
        command.newLikeStatusForComment,
      );
      return {
        data: 'ok',
        resultCode: ResultCode.NoContent,
      };
    }
    await this.commentRepository.updateLikeStatus(
      new Types.ObjectId(commentInfo.id),
      new Types.ObjectId(currentUser!.id),
      command.newLikeStatusForComment,
    );

    //findLikeStatusInDB.likeStatus = newLikeStatusForComment;

    return {
      data: 'ok',
      resultCode: ResultCode.NoContent,
    };
    // return commentRepository.updatedCommentLikeStatusById(commentInfo._id.toString(), newLikeStatusForComment)
  }
}
