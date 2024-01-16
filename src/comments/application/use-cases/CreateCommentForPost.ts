import { CommentsRepository } from '../../comments.repository';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { getUserViewModel } from '../../../users/user.types';
import { ResultCode, ResultObject } from '../../../helpers/heplersType';
import { PostViewModel } from '../../../posts/post.types';
import { CommentsDBType, LikeStatusOption } from '../../comments.types';
import { ObjectId } from 'mongodb';
import { Types } from 'mongoose';
import { PostQueryRepository } from '../../../posts/postQuery.repository';

export class CreateCommentForPostCommand {
  constructor(
    public postId: string,
    public currentUser: getUserViewModel,
    public content: string,
  ) {}
}

@CommandHandler(CreateCommentForPostCommand)
export class CreateCommentForPost
  implements ICommandHandler<CreateCommentForPostCommand>
{
  constructor(
    public commentRepository: CommentsRepository,
    public postQueryRepository: PostQueryRepository,
  ) {}

  async execute(
    command: CreateCommentForPostCommand,
  ): Promise<ResultObject<string>> {
    const currentPost: PostViewModel | null =
      await this.postQueryRepository.findPostById(command.postId.toString());
    if (!currentPost) {
      return {
        data: null,
        resultCode: ResultCode.NotFound,
        message: 'couldn`t find blog',
      };
    }
    const newComment: CommentsDBType = {
      _id: new ObjectId(),
      content: command.content,
      commentatorInfo: {
        userId: new Types.ObjectId(command.currentUser.id).toString(),
        userLogin: command.currentUser.login,
      },
      postId: command.postId,
      createdAt: new Date(),
      likesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: LikeStatusOption.None,
      },
    };
    const resultId =
      await this.commentRepository.createCommentForPost(newComment);
    if (!resultId) {
      return {
        data: null,
        resultCode: ResultCode.BadRequest,
        message: 'couldn`t comment post',
      };
    }

    return {
      data: resultId.toString(),
      resultCode: ResultCode.NoContent,
    };
  }
}
