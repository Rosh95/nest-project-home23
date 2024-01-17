import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ResultCode, ResultObject } from '../../../helpers/heplersType';
import { Helpers } from '../../../helpers/helpers';
import { PostRepository } from '../../post.repository';
import { CreatePostDto, PostDBModel } from '../../post.types';
import { ObjectId } from 'mongodb';
import { BlogQueryRepository } from '../../../blogs/blogQuery.repository';

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
    public postRepository: PostRepository,
    public blogQueryRepository: BlogQueryRepository,
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

    const newPost: PostDBModel = {
      _id: new ObjectId(),
      title: command.postInputData.title,
      shortDescription: command.postInputData.shortDescription,
      content: command.postInputData.content,
      blogId: command.blogId,
      blogName: foundBlog.name,
      createdAt: new Date(),
    };
    const createdPostId = await this.postRepository.createPost(newPost);
    return {
      data: createdPostId,
      resultCode: ResultCode.Created,
    };
  }
}
