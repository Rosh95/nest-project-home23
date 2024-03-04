import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ResultCode, ResultObject } from '../../../helpers/heplersType';
import { Helpers } from '../../../helpers/helpers';
import { BlogDbType, CreateBlogDto } from '../../../blogs/blogs.types';
import { ObjectId } from 'mongodb';
import { BlogRepositorySql } from '../../blog.repository.sql';

export class CreateBlogCommand {
  constructor(public blogData: CreateBlogDto) {}
}

@CommandHandler(CreateBlogCommand)
export class CreateBlog implements ICommandHandler<CreateBlogCommand> {
  constructor(
    protected blogRepository: BlogRepositorySql,
    public helpers: Helpers,
  ) {}

  async execute(command: CreateBlogCommand): Promise<ResultObject<string>> {
    await this.helpers.validateOrRejectModel(command.blogData, CreateBlogDto);
    const newBlog: BlogDbType = {
      _id: new ObjectId(),
      name: command.blogData.name,
      description: command.blogData.description,
      websiteUrl: command.blogData.websiteUrl,
      createdAt: new Date(),
      isMembership: false,
    };
    const createdBlogId = await this.blogRepository.createBlog(newBlog);
    if (!createdBlogId) {
      return {
        data: null,
        resultCode: ResultCode.BadRequest,
        message: 'couldn`t create a new blog',
      };
    }
    return {
      data: createdBlogId,
      resultCode: ResultCode.NoContent,
    };
  }
}
