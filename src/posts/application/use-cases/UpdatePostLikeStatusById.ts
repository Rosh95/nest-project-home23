import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ResultCode, ResultObject } from '../../../helpers/heplersType';
import { Helpers } from '../../../helpers/helpers';
import { LikeStatusOption } from '../../../comments/comments.types';
import {
  LikeStatus,
  LikeStatusDocument,
} from '../../../likeStatus/likeStatus.type';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { UsersQuerySqlRepository } from '../../../users/usersQuery.repository.sql';
import { PostRepositorySql } from '../../post.repository.sql';

export class UpdatePostLikeStatusByIdCommand {
  constructor(
    public postId: string,
    public newLikeStatusForComment: LikeStatusOption,
    public userId: string,
  ) {}
}

@CommandHandler(UpdatePostLikeStatusByIdCommand)
export class UpdatePostLikeStatusById
  implements ICommandHandler<UpdatePostLikeStatusByIdCommand>
{
  constructor(
    public postRepository: PostRepositorySql,
    public helpers: Helpers,
    public usersQueryRepository: UsersQuerySqlRepository,
    @InjectModel(LikeStatus.name)
    public likeStatusModel: Model<LikeStatusDocument>,
  ) {}

  async execute(
    command: UpdatePostLikeStatusByIdCommand,
  ): Promise<ResultObject<string>> {
    const postInfo = await this.postRepository.getPostById(command.postId);
    if (!postInfo) {
      return {
        data: null,
        resultCode: ResultCode.NotFound,
        message: 'couldn`t find post',
      };
    }
    const currentUser = await this.usersQueryRepository.findUserById(
      command.userId,
    );
    if (!currentUser) {
      return {
        data: null,
        resultCode: ResultCode.Unauthorized,
        message: 'couldn`t find User',
      };
    }

    const isExistLikeStatusForPost: boolean =
      await this.postRepository.findLikeStatusForPost(
        command.postId,
        command.userId,
      );

    if (!isExistLikeStatusForPost) {
      await this.postRepository.createLikeStatusForPost(
        postInfo.id,
        currentUser!.id,
        command.newLikeStatusForComment,
      );
      return {
        data: 'ok',
        resultCode: ResultCode.NoContent,
      };
    }
    await this.postRepository.updatePostLikeStatus(
      postInfo.id,
      currentUser!.id,
      command.newLikeStatusForComment,
    );

    return {
      data: 'ok',
      resultCode: ResultCode.NoContent,
    };
  }
}
