import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ResultCode, ResultObject } from '../../../helpers/heplersType';
import { Helpers } from '../../../helpers/helpers';
import { PostRepositorySql } from '../../post.repository.sql';
import { PostQueryRepositorySql } from '../../postQuery.repository.sql';

export class DeletePostCommand {
  constructor(public postId: string) {}
}

@CommandHandler(DeletePostCommand)
export class DeletePost implements ICommandHandler<DeletePostCommand> {
  constructor(
    public postRepository: PostRepositorySql,
    public postQueryRepository: PostQueryRepositorySql,
    public helpers: Helpers,
  ) {}

  async execute(command: DeletePostCommand): Promise<ResultObject<string>> {
    if (!command.postId) {
      return {
        data: null,
        resultCode: ResultCode.NotFound,
        message: 'couldn`t find blog',
      };
    }

    const isExistPost = await this.postQueryRepository.findPostById(
      command.postId,
    );
    if (!isExistPost) {
      return {
        data: null,
        resultCode: ResultCode.NotFound,
        message: 'couldn`t find post',
      };
    }
    const isDeleted = await this.postRepository.deletePost(command.postId);
    if (!isDeleted) {
      return {
        data: null,
        resultCode: ResultCode.BadRequest,
        message: 'couldn`t delete post',
      };
    }
    return {
      data: 'ok',
      resultCode: ResultCode.NoContent,
    };
  }
}
