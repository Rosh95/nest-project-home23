import { CommentsRepository } from '../../comments.repository';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentsQueryRepository } from '../../commentsQuery.repository';
import { ResultCode, ResultObject } from '../../../helpers/heplersType';

export class UpdateCommentByIdCommand {
  constructor(
    public commentId: string,
    public commentContent: string,
    public userId: string,
  ) {}
}

@CommandHandler(UpdateCommentByIdCommand)
export class UpdateCommentById
  implements ICommandHandler<UpdateCommentByIdCommand>
{
  constructor(
    public commentRepository: CommentsRepository,
    public commentQueryRepository: CommentsQueryRepository,
  ) {}

  async execute(
    command: UpdateCommentByIdCommand,
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
    if (commentInfo.commentatorInfo.userId !== command.userId) {
      return {
        data: null,
        resultCode: ResultCode.Forbidden,
        message: 'couldn`t update comment, another owner of comment',
      };
    }
    const result = this.commentRepository.updatedCommentById(
      command.commentId,
      command.commentContent,
    );
    if (!result) {
      return {
        data: null,
        resultCode: ResultCode.BadRequest,
        message: 'couldn`t update comment',
      };
    }
    return {
      data: 'ok',
      resultCode: ResultCode.NoContent,
    };
  }
}
