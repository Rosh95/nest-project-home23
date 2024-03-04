import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ResultCode, ResultObject } from '../../../helpers/heplersType';
import { Helpers } from '../../../helpers/helpers';
import { CreatePostDto, PostInputTypeToDBSql } from '../../post.types';
import { PostRepositorySql } from '../../post.repository.sql';
import { BlogQueryRepositorySql } from '../../../blogs/blogQuery.repository.sql';

export class CreatePostForExistingBlogCommand {
  constructor(
    public postInputData: CreatePostDto,
    public blogId: string,
  ) {}
}

@CommandHandler(CreatePostForExistingBlogCommand)
export class CreatePostForExistingBlog
  implements ICommandHandler<CreatePostForExistingBlogCommand>
{
  constructor(
    public postRepository: PostRepositorySql,
    public blogQueryRepository: BlogQueryRepositorySql,
    public helpers: Helpers,
  ) {}

  async execute(
    command: CreatePostForExistingBlogCommand,
  ): Promise<ResultObject<string>> {
    const foundBlog = await this.blogQueryRepository.findBlogById(
      command.blogId,
    );
    if (!foundBlog) {
      return {
        data: null,
        resultCode: ResultCode.NotFound,
        message: 'couldn`t find blog',
      };
    }
    await this.helpers.validateOrRejectModel(
      command.postInputData,
      CreatePostDto,
    );

    const newPost: PostInputTypeToDBSql = {
      title: command.postInputData.title,
      shortDescription: command.postInputData.shortDescription,
      content: command.postInputData.content,
      blogId: command.blogId,
    };
    const createdPostId = await this.postRepository.createPost(newPost);
    return {
      data: createdPostId,
      resultCode: ResultCode.Created,
    };
  }
}
