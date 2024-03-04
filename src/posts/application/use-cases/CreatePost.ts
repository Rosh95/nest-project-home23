import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ResultCode, ResultObject } from '../../../helpers/heplersType';
import { Helpers } from '../../../helpers/helpers';
import {
  CreatePostWithBlogIdDto,
  PostInputTypeToDBSql,
} from '../../post.types';
import { BlogViewType } from '../../../blogs/blogs.types';
import { PostRepositorySql } from '../../post.repository.sql';
import { BlogQueryRepositorySql } from '../../../blogs/blogQuery.repository.sql';

export class CreatePostCommand {
  constructor(
    public createPostDto: CreatePostWithBlogIdDto,
    public blogId: string,
  ) {}
}

@CommandHandler(CreatePostCommand)
export class CreatePost implements ICommandHandler<CreatePostCommand> {
  constructor(
    public postRepository: PostRepositorySql,
    public blogQueryRepository: BlogQueryRepositorySql,
    public helpers: Helpers,
  ) {}

  async execute(command: CreatePostCommand): Promise<ResultObject<string>> {
    await this.helpers.validateOrRejectModel(
      command.createPostDto,
      CreatePostWithBlogIdDto,
    );

    const foundBlog: BlogViewType | null =
      await this.blogQueryRepository.findBlogById(command.blogId);
    if (!foundBlog) {
      return {
        data: null,
        resultCode: ResultCode.BadRequest,
        message: 'couldn`t find this blog',
      };
    }
    const newPost: PostInputTypeToDBSql = {
      title: command.createPostDto.title,
      shortDescription: command.createPostDto.shortDescription,
      content: command.createPostDto.content,
      blogId: command.blogId,
    };
    const createdPostId = await this.postRepository.createPost(newPost);
    if (createdPostId) {
      return {
        data: createdPostId,
        resultCode: ResultCode.Created,
      };
    }
    return {
      data: null,
      resultCode: ResultCode.BadRequest,
      message: 'couldn`t create a new post',
    };
  }
}
