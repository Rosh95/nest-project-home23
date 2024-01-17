import { CommentsRepository } from '../../comments.repository';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ResultCode, ResultObject } from '../../../helpers/heplersType';

export class DeleteCommentByIdCommand {
  constructor(
    public commentId: string,
    public userId: string,
  ) {}
}
@CommandHandler(DeleteCommentByIdCommand)
export class DeleteCommentById
  implements ICommandHandler<DeleteCommentByIdCommand>
{
  constructor(public commentRepository: CommentsRepository) {}

  async execute(
    command: DeleteCommentByIdCommand,
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
    if (commentInfo.commentatorInfo.userId !== command.userId) {
      return {
        data: null,
        resultCode: ResultCode.Forbidden,
        message: 'couldn`t update comment, another owner of commment',
      };
    }
    const result = await this.commentRepository.deleteCommentById(
      command.commentId,
    );
    if (!result) {
      return {
        data: null,
        resultCode: ResultCode.BadRequest,
        message: 'couldn`t delete comment',
      };
    }
    return {
      data: 'ok',
      resultCode: ResultCode.NoContent,
    };
  }
}
