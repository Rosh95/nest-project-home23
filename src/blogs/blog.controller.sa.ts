import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Injectable,
  NotFoundException,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Helpers, queryDataType } from '../helpers/helpers';
import { BlogViewType, CreateBlogDto } from './blogs.types';
import {
  CreatePostDto,
  PaginatorPostViewType,
  PostViewModel,
} from '../posts/post.types';
import { mappingErrorStatus, ResultObject } from '../helpers/heplersType';
import { ParseStringPipe } from '../pipes/ParseObjectIdPipe';
import { BasicAuthGuard } from '../auth/guards/basic-auth.guard';
import { QueryData } from '../helpers/decorators/helpers.decorator.queryData';
import { AccessTokenHeader } from '../users/decorators/user.decorator';
import { CommandBus } from '@nestjs/cqrs';
import { CreatePostForExistingBlogCommand } from '../posts/application/use-cases/CreatePostForExistingBlog';
import { DeleteBlogCommand } from './application/use-cases/DeleteBlog';
import { UpdateBlogCommand } from './application/use-cases/UpdateBlog';
import { GetUserIdByAccessTokenCommand } from '../jwt/application/use-cases/GetUserIdByAccessToken';
import { SkipThrottle } from '@nestjs/throttler';
import { BlogQueryRepositorySql } from './blogQuery.repository.sql';
import { CreateBlogCommand } from './application/use-cases/CreateBlog';
import { PostQueryRepositorySql } from '../posts/postQuery.repository.sql';
import { UpdatePostCommand } from '../posts/application/use-cases/UpdatePost';
import { DeletePostCommand } from '../posts/application/use-cases/DeletePost';
import { isPostCreatedByCurrentBlogCommand } from '../posts/application/use-cases/isPostCreatedByCurrentBlog';

@Injectable()
@SkipThrottle()
@Controller('sa/blogs')
export class BlogSAController {
  constructor(
    public blogQueryRepository: BlogQueryRepositorySql,
    public postQueryRepository: PostQueryRepositorySql,
    public helpers: Helpers,
    private commandBus: CommandBus,
  ) {}

  @UseGuards(BasicAuthGuard)
  @Get()
  async getBlogs(@QueryData() queryData: queryDataType) {
    return await this.blogQueryRepository.getAllBlogs(queryData);
  }

  @UseGuards(BasicAuthGuard)
  @Get(':blogId')
  async getBlogById(@Param('blogId', new ParseStringPipe()) blogId: string) {
    // if (!blogId) throw new NotFoundException();
    const foundBlog: BlogViewType | null =
      await this.blogQueryRepository.findBlogById(blogId);
    if (foundBlog) {
      return foundBlog;
    }
    throw new NotFoundException({
      message: { error: 'couldn`t find' },
    });
  }

  @UseGuards(BasicAuthGuard)
  @Delete(':blogId')
  @HttpCode(204)
  async deleteBlog(@Param('blogId', new ParseStringPipe()) blogId: string) {
    const result = await this.commandBus.execute(new DeleteBlogCommand(blogId));
    if (result.data === null) return mappingErrorStatus(result);
    return true;
  }

  @UseGuards(BasicAuthGuard)
  @Post()
  async createBlog(@Body() inputData: CreateBlogDto) {
    const createBlogInfo: ResultObject<string> = await this.commandBus.execute(
      new CreateBlogCommand(inputData),
    );
    if (createBlogInfo.data === null) return mappingErrorStatus(createBlogInfo);
    return await this.blogQueryRepository.findBlogById(createBlogInfo.data);
  }

  @UseGuards(BasicAuthGuard)
  @Put(':blogId')
  @HttpCode(204)
  async updateBlog(
    @Param('blogId', new ParseStringPipe()) blogId: string,
    @Body() createBlogDto: CreateBlogDto,
  ) {
    const updateBlog: ResultObject<string> = await this.commandBus.execute(
      new UpdateBlogCommand(blogId, createBlogDto),
    );
    if (updateBlog.data === null) {
      mappingErrorStatus(updateBlog);
    }
    return true;
  }

  @Get(':blogId/posts')
  async getPostsFromBlogById(
    @QueryData() queryData: queryDataType,
    @Param('blogId', new ParseStringPipe()) blogId: string,
    @AccessTokenHeader() accessToken: string,
  ) {
    const currentAccessToken = accessToken ? accessToken : null;
    const userId = await this.commandBus.execute(
      new GetUserIdByAccessTokenCommand(currentAccessToken),
    );
    const foundPosts: PaginatorPostViewType | null =
      await this.postQueryRepository.getAllPostOfBlog(
        blogId,
        queryData,
        userId,
      );
    return foundPosts;
  }

  @UseGuards(BasicAuthGuard)
  @Post(':blogId/posts')
  @HttpCode(201)
  async createPostForBlogById(
    @QueryData() queryData: queryDataType,
    @Param('blogId', new ParseStringPipe()) blogId: string,
    @Body() createPostDto: CreatePostDto,
  ) {
    const newPost: ResultObject<string> = await this.commandBus.execute(
      new CreatePostForExistingBlogCommand(createPostDto, blogId),
    );
    if (newPost.data === null) {
      return mappingErrorStatus(newPost);
    }
    const gotNewPost: PostViewModel | null = newPost.data
      ? await this.postQueryRepository.findPostById(newPost.data)
      : null;
    return gotNewPost;
  }

  @UseGuards(BasicAuthGuard)
  @Put(':blogId/posts/:postId')
  @HttpCode(204)
  async updatePostForBlogByIdAndPostId(
    @QueryData() queryData: queryDataType,
    @Param('blogId', new ParseStringPipe()) blogId: string,
    @Param('postId', new ParseStringPipe()) postId: string,
    @Body() updateDataPost: CreatePostDto,
  ) {
    const isPostCreatedByCurrentBlog: ResultObject<string> =
      await this.commandBus.execute(
        new isPostCreatedByCurrentBlogCommand(blogId, postId),
      );
    if (isPostCreatedByCurrentBlog.data === null)
      return mappingErrorStatus(isPostCreatedByCurrentBlog);

    const PostUpdatedInfo: ResultObject<string> = await this.commandBus.execute(
      new UpdatePostCommand(postId, { blogId, ...updateDataPost }),
    );
    if (PostUpdatedInfo.data === null)
      return mappingErrorStatus(PostUpdatedInfo);
    return true;

    // const newPost: ResultObject<string> = await this.commandBus.execute(
    //   new CreatePostForExistingBlogCommand(createPostDto, blogId),
    // );
    // if (newPost.data === null) {
    //   return mappingErrorStatus(newPost);
    // }
    // const gotNewPost: PostViewModel | null = newPost.data
    //   ? await this.postQueryRepository.findPostById(newPost.data)
    //   : null;
    // return gotNewPost;
  }

  @UseGuards(BasicAuthGuard)
  @Delete(':blogId/posts/:postId')
  @HttpCode(204)
  async deletePostForBlogByIdAndPostId(
    @QueryData() queryData: queryDataType,
    @Param('blogId', new ParseStringPipe()) blogId: string,
    @Param('postId', new ParseStringPipe()) postId: string,
  ) {
    const isPostCreatedByCurrentBlog: ResultObject<string> =
      await this.commandBus.execute(
        new isPostCreatedByCurrentBlogCommand(blogId, postId),
      );
    if (isPostCreatedByCurrentBlog.data === null)
      return mappingErrorStatus(isPostCreatedByCurrentBlog);
    const PostUpdatedInfo: ResultObject<string> = await this.commandBus.execute(
      new DeletePostCommand(postId),
    );
    if (PostUpdatedInfo.data === null)
      return mappingErrorStatus(PostUpdatedInfo);
    return true;
  }
}
