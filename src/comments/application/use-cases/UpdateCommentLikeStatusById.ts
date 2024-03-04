import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ResultCode, ResultObject } from '../../../helpers/heplersType';
import { LikeStatusOption } from '../../comments.types';
import {
  LikeStatus,
  LikeStatusDocument,
} from '../../../likeStatus/likeStatus.type';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CommentsRepositorySql } from '../../comments.repository.sql';
import { UsersQuerySqlRepository } from '../../../users/usersQuery.repository.sql';

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
    public commentRepository: CommentsRepositorySql,
    public usersRepository: UsersQuerySqlRepository,
    @InjectModel(LikeStatus.name)
    public likeStatusModel: Model<LikeStatusDocument>,
  ) {}

  async execute(
    command: UpdateCommentLikeStatusByIdCommand,
  ): Promise<ResultObject<string>> {
    const commentInfo = await this.commentRepository.getCommentById(
      command.commentId,
    );
    if (!commentInfo)
      return {
        data: null,
        resultCode: ResultCode.NotFound,
        message: 'couldn`t find comment',
      };
    const findLikeStatusInDB: boolean =
      await this.commentRepository.findLikeStatusForComment(
        command.commentId,
        command.userId,
      );

    if (!findLikeStatusInDB) {
      await this.commentRepository.createLikeStatusForComment(
        command.commentId,
        command.userId,
        command.newLikeStatusForComment,
      );
      return {
        data: 'ok',
        resultCode: ResultCode.NoContent,
      };
    }
    await this.commentRepository.updateLikeStatusForComments(
      command.commentId,
      command.userId,
      command.newLikeStatusForComment,
    );

    return {
      data: 'ok',
      resultCode: ResultCode.NoContent,
    };
  }
}
