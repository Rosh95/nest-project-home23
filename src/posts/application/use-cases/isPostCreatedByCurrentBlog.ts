import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ResultCode, ResultObject } from '../../../helpers/heplersType';
import { PostQueryRepositorySql } from '../../postQuery.repository.sql';
import { BlogQueryRepositorySql } from '../../../blogs/blogQuery.repository.sql';

export class isPostCreatedByCurrentBlogCommand {
  constructor(
    public blogId: string,
    public postId: string,
  ) {}
}

@CommandHandler(isPostCreatedByCurrentBlogCommand)
export class isPostCreatedByCurrentBlog
  implements ICommandHandler<isPostCreatedByCurrentBlogCommand>
{
  constructor(
    public postQueryRepository: PostQueryRepositorySql,
    public blogQueryRepository: BlogQueryRepositorySql,
  ) {}

  async execute(
    command: isPostCreatedByCurrentBlogCommand,
  ): Promise<ResultObject<string>> {
    const isExistPost = await this.postQueryRepository.findPostById(
      command.postId,
    );
    const isExistBlog = await this.blogQueryRepository.findBlogById(
      command.blogId,
    );
    if (!isExistPost) {
      return {
        data: null,
        resultCode: ResultCode.NotFound,
        message: 'couldn`t find post',
      };
    }
    if (!isExistBlog) {
      return {
        data: null,
        resultCode: ResultCode.NotFound,
        message: 'couldn`t find blog',
      };
    }
    if (isExistPost.blogId !== command.blogId) {
      return {
        data: null,
        resultCode: ResultCode.NotFound,
        message: 'this blog does`n have this post',
      };
    }

    return {
      data: 'ok',
      resultCode: ResultCode.NoContent,
    };
  }
}
