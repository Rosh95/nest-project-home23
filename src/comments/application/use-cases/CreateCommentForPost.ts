import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { getUserViewModel } from '../../../users/user.types';
import { ResultCode, ResultObject } from '../../../helpers/heplersType';
import { PostViewModel } from '../../../posts/post.types';
import { InputCommentsDBTypeSql } from '../../comments.types';
import { CommentsRepositorySql } from '../../comments.repository.sql';
import { PostQueryRepositorySql } from '../../../posts/postQuery.repository.sql';

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
    public commentRepository: CommentsRepositorySql,
    public postQueryRepository: PostQueryRepositorySql,
  ) {}

  async execute(
    command: CreateCommentForPostCommand,
  ): Promise<ResultObject<string>> {
    const currentPost: PostViewModel | null =
      await this.postQueryRepository.findPostById(command.postId);
    if (!currentPost) {
      return {
        data: null,
        resultCode: ResultCode.NotFound,
        message: 'couldn`t find blog',
      };
    }
    const newComment: InputCommentsDBTypeSql = {
      content: command.content,
      userId: command.currentUser.id,
      postId: command.postId,
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
      data: resultId,
      resultCode: ResultCode.NoContent,
    };
  }
}
