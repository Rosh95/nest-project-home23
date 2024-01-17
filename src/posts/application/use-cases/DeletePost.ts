import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ResultCode, ResultObject } from '../../../helpers/heplersType';
import { Helpers } from '../../../helpers/helpers';
import { PostRepository } from '../../post.repository';
import { PostQueryRepository } from '../../postQuery.repository';

export class DeletePostCommand {
  constructor(public postId: string) {}
}

@CommandHandler(DeletePostCommand)
export class DeletePost implements ICommandHandler<DeletePostCommand> {
  constructor(
    public postRepository: PostRepository,
    public postQueryRepository: PostQueryRepository,
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
