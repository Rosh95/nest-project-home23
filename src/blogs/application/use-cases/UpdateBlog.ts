import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ResultCode, ResultObject } from '../../../helpers/heplersType';
import { Helpers } from '../../../helpers/helpers';
import { CreateBlogDto } from '../../../blogs/blogs.types';
import { BlogQueryRepositorySql } from '../../blogQuery.repository.sql';
import { BlogRepositorySql } from '../../blog.repository.sql';

export class UpdateBlogCommand {
  constructor(
    public blogId: string,
    public blogUpdateData: CreateBlogDto,
  ) {}
}

@CommandHandler(UpdateBlogCommand)
export class UpdateBlog implements ICommandHandler<UpdateBlogCommand> {
  constructor(
    protected blogRepository: BlogRepositorySql,
    protected blogQueryRepository: BlogQueryRepositorySql,
    public helpers: Helpers,
  ) {}

  async execute(command: UpdateBlogCommand): Promise<ResultObject<string>> {
    await this.helpers.validateOrRejectModel(
      command.blogUpdateData,
      CreateBlogDto,
    );

    const isExistBlog = await this.blogQueryRepository.findBlogById(
      command.blogId,
    );
    if (!isExistBlog) {
      return {
        data: null,
        resultCode: ResultCode.NotFound,
        message: 'couldn`t find blog',
      };
    }
    const updateBlog = await this.blogRepository.updateBlog(
      command.blogId,
      command.blogUpdateData,
    );
    if (!updateBlog) {
      return {
        data: null,
        resultCode: ResultCode.BadRequest,
        message: 'couldn`t update blog',
      };
    }
    return {
      data: command.blogId,
      resultCode: ResultCode.NoContent,
    };
  }
}
