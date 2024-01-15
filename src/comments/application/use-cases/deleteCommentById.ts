import { CommentsRepository } from '../../comments.repository';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class DeleteCommentByIdCommand {
  constructor(public commentId: string) {}
}
@CommandHandler(DeleteCommentByIdCommand)
export class DeleteCommentById
  implements ICommandHandler<DeleteCommentByIdCommand>
{
  constructor(public commentRepository: CommentsRepository) {}

  async execute(command: DeleteCommentByIdCommand) {
    const commentInfo = await this.commentRepository.getCommentById(
      command.commentId,
    );
    if (!commentInfo) return null;
    return await this.commentRepository.deleteCommentById(command.commentId);
  }
}
