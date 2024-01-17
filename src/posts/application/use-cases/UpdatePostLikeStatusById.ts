import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ResultCode, ResultObject } from '../../../helpers/heplersType';
import { Helpers } from '../../../helpers/helpers';
import { PostRepository } from '../../post.repository';
import { LikeStatusOption } from '../../../comments/comments.types';
import {
  LikeStatus,
  LikeStatusDBType,
  LikeStatusDocument,
} from '../../../likeStatus/likeStatus.type';
import { Model, Types } from 'mongoose';
import { UsersQueryRepository } from '../../../users/usersQuery.repository';
import { InjectModel } from '@nestjs/mongoose';

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
    public postRepository: PostRepository,
    public helpers: Helpers,
    public usersQueryRepository: UsersQueryRepository,
    @InjectModel(LikeStatus.name)
    public likeStatusModel: Model<LikeStatusDocument>,
  ) {}

  async execute(
    command: UpdatePostLikeStatusByIdCommand,
  ): Promise<ResultObject<string>> {
    const postInfo = await this.postRepository.getPostById(
      command.postId.toString(),
    );
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

    const findPostLikeStatusInDB: LikeStatusDBType | null =
      await this.likeStatusModel.findOne({
        entityId: postInfo._id,
        userId: new Types.ObjectId(currentUser!.id),
      });

    if (!findPostLikeStatusInDB) {
      await this.postRepository.createLikeStatusForPost(
        postInfo._id,
        new Types.ObjectId(currentUser!.id),
        currentUser!.login,
        command.newLikeStatusForComment,
      );
      return {
        data: 'ok',
        resultCode: ResultCode.NoContent,
      };
    }
    await this.postRepository.updatePostLikeStatus(
      postInfo._id,
      new Types.ObjectId(currentUser!.id),
      command.newLikeStatusForComment,
    );

    return {
      data: 'ok',
      resultCode: ResultCode.NoContent,
    };
  }
}
