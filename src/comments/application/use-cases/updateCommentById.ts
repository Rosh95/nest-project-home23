import { CommentsRepository } from '../../comments.repository';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForbiddenException } from '@nestjs/common';
import { CommentsQueryRepository } from '../../commentsQuery.repository';

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

  async execute(command: UpdateCommentByIdCommand) {
    const commentInfo = await this.commentQueryRepository.getCommentById(
      command.commentId,
    );
    if (!commentInfo) return null;
    if (commentInfo?.commentatorInfo.userId !== command.userId) {
      throw new ForbiddenException();
    }
    return this.commentRepository.updatedCommentById(
      command.commentId,
      command.commentContent,
    );
  }
}
