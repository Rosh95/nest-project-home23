import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ResultCode, ResultObject } from '../../../helpers/heplersType';
import { Helpers } from '../../../helpers/helpers';
import { PostRepository } from '../../post.repository';
import { CreatePostDto, PostDBModel } from '../../post.types';
import { BlogViewType } from '../../../blogs/blogs.types';
import { ObjectId } from 'mongodb';
import { BlogQueryRepository } from '../../../blogs/blogQuery.repository';

export class CreatePostCommand {
  constructor(
    public createPostDto: CreatePostDto,
    public blogId: string,
  ) {}
}

@CommandHandler(CreatePostCommand)
export class CreatePost implements ICommandHandler<CreatePostCommand> {
  constructor(
    public postRepository: PostRepository,
    public blogQueryRepository: BlogQueryRepository,
    public helpers: Helpers,
  ) {}

  async execute(command: CreatePostCommand): Promise<ResultObject<string>> {
    await this.helpers.validateOrRejectModel(
      command.createPostDto,
      CreatePostDto,
    );

    const foundBlog: BlogViewType | null =
      await this.blogQueryRepository.findBlogById(command.blogId);
    if (!foundBlog) {
      const error: ResultObject<string> = {
        data: null,
        resultCode: ResultCode.BadRequest,
        message: 'couldn`t find this blog',
      };
      return error;
    }
    const newPost: PostDBModel = {
      _id: new ObjectId(),
      title: command.createPostDto.title,
      shortDescription: command.createPostDto.shortDescription,
      content: command.createPostDto.content,
      blogId: command.blogId,
      blogName: foundBlog.name,
      createdAt: new Date(),
    };
    const createdPostId = await this.postRepository.createPost(newPost);
    if (createdPostId) {
      const result: ResultObject<string> = {
        data: createdPostId,
        resultCode: ResultCode.Created,
      };

      return result;
    }
    return {
      data: null,
      resultCode: ResultCode.BadRequest,
      message: 'couldn`t create a new post',
    };
  }
}
