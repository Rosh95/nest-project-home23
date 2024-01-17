import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ResultCode, ResultObject } from '../../../helpers/heplersType';
import { Helpers } from '../../../helpers/helpers';
import { BlogRepository } from '../../blog.repository';
import { BlogQueryRepository } from '../../blogQuery.repository';

export class DeleteBlogCommand {
  constructor(public blogId: string) {}
}

@CommandHandler(DeleteBlogCommand)
export class DeleteBlog implements ICommandHandler<DeleteBlogCommand> {
  constructor(
    protected blogRepository: BlogRepository,
    protected blogQueryRepository: BlogQueryRepository,
    public helpers: Helpers,
  ) {}

  async execute(command: DeleteBlogCommand): Promise<ResultObject<string>> {
    const isExistBlog = await this.blogQueryRepository.findBlogById(
      command.blogId,
    );
    if (!isExistBlog) {
      return {
        data: null,
        resultCode: ResultCode.NotFound,
        message: 'couldn`t find blog',
        field: 'blog',
      };
    }
    const deleteBlog = await this.blogRepository.deleteBlog(command.blogId);
    if (!deleteBlog) {
      return {
        data: null,
        resultCode: ResultCode.BadRequest,
        message: 'couldn`t  delete blog',
      };
    }
    return {
      data: 'ok',
      resultCode: ResultCode.NoContent,
    };
  }
}
