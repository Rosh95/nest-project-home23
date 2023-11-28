import {
  Body,
  Controller,
  Delete,
  Get,
  Injectable,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { BlogService } from './blogs.service';
import { BlogQueryRepository } from './blogQuery.repository';
import { PostService } from '../posts/post.service';
import { PostQueryRepository } from '../posts/postQuery.repository';
import { Helpers, queryDataType } from '../helpers/helpers';
import {
  BlogInputModel,
  BlogViewType,
  PaginatorBlogViewType,
} from './blogs.types';

@Injectable()
@Controller('blogs')
export class BlogController {
  constructor(
    public blogService: BlogService,
    public blogQueryRepository: BlogQueryRepository,
    public postService: PostService,
    public postQueryRepository: PostQueryRepository,
    public helpers: Helpers,
  ) {}
  @Get()
  async getBlogs(@Query() query: any) {
    try {
      const queryData: queryDataType =
        await this.helpers.getDataFromQuery(query);
      const allBlogs: PaginatorBlogViewType =
        await this.blogQueryRepository.getAllBlogs(queryData);
      return allBlogs;
    } catch (e) {
      console.log(e);
      return new Error('something wrong');
    }
  }
  @Get(':id')
  async getBlogById(@Param('id') id: string) {
    const foundBlog: BlogViewType | null =
      await this.blogQueryRepository.findBlogById(id);
    if (foundBlog) {
      return foundBlog;
    }
    return new Error('something wrong status 404');
  }

  @Delete(':id')
  // @HttpStatus(HttpStatusCode.NO_CONTENT)
  async deleteBlog(@Param('id') id: string) {
    const isDeleted: boolean = await this.blogService.deleteBlog(id);
    if (isDeleted) {
      return true;
    } else false;
  }

  @Post()
  // @HttpStatus(HttpStatusCode.CREATED)
  async createBlog(@Body() { name, description, websiteUrl }) {
    try {
      const BlogInputData: BlogInputModel = {
        name: name,
        description: description,
        websiteUrl: websiteUrl,
      };
      const newBlog: BlogViewType =
        await this.blogService.createBlog(BlogInputData);

      return newBlog;
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  @Put(':id')
  async updateBlog(
    @Param('id') id: string,
    @Body() { name, description, websiteUrl },
  ) {
    const isExistBlog = await this.blogQueryRepository.findBlogById(id);
    if (!isExistBlog) {
      return false;
    }
    try {
      const BlogUpdateData: BlogInputModel = {
        name: name,
        description: description,
        websiteUrl: websiteUrl,
      };
      const isBlogUpdate: boolean = await this.blogService.updateBlog(
        id,
        BlogUpdateData,
      );
      if (isBlogUpdate) {
        return true;
      } else {
        return false;
      }
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  // async getPostsFromBlogById(req: Request, res: Response) {
  //   const isExistBlog = await this.blogQueryRepository.findBlogById(
  //     req.params.id,
  //   );
  //   if (!isExistBlog) {
  //     res.sendStatus(404);
  //     return;
  //   }
  //   let userId = null;
  //   if (req.headers.authorization) {
  //     const token = req.headers.authorization.split(' ')[1];
  //     userId = await jwtService.getUserIdByAccessToken(token.toString());
  //   }
  //   try {
  //     const queryData: queryDataType = await getDataFromQuery(req.query);
  //     const foundPosts: PaginatorPostViewType =
  //       await this.blogQueryRepository.getAllPostOfBlog(
  //         req.params.id,
  //         queryData,
  //         userId,
  //       );
  //     return res.send(foundPosts);
  //   } catch (e) {
  //     return res.status(500).json(e);
  //   }
  // }
  //
  // async createPostForBlogById(req: Request, res: Response) {
  //   const isExistBlog = await this.blogQueryRepository.findBlogById(
  //     req.params.id,
  //   );
  //   if (!isExistBlog) {
  //     res.sendStatus(404);
  //     return;
  //   }
  //   try {
  //     const postInputData: postInputDataModelForExistingBlog = {
  //       title: req.body.title,
  //       shortDescription: req.body.shortDescription,
  //       content: req.body.content,
  //     };
  //     const newPost: ResultObject<string> =
  //       await this.postService.createPostForExistingBlog(
  //         req.params.id,
  //         postInputData,
  //       );
  //     const gotNewPost: PostViewModel | null = newPost.data
  //       ? await this.postQueryRepository.findPostById(newPost.data)
  //       : null;
  //     return res.status(201).send(gotNewPost);
  //   } catch (e) {
  //     return res.status(500).json(e);
  //   }
  // }
}
