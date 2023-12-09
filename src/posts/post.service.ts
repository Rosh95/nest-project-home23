import { Injectable } from '@nestjs/common';
import { PostRepository } from './post.repository';
import { PostQueryRepository } from './postQuery.repository';
import { BlogViewType } from '../blogs/blogs.types';
import { ObjectId } from 'mongodb';
import { BlogQueryRepository } from '../blogs/blogQuery.repository';
import { CreatePostDto, PostDBModel, postInputDataModel } from './post.types';
import { ResultObject } from '../helpers/heplersType';
import { LikeStatusOption } from '../comments/comments.types';
import { LikeStatusDBType } from '../likeStatus/likeStatus.type';
import { LikeStatusModel } from '../db/dbMongo';
import { Types } from 'mongoose';
import { Helpers } from '../helpers/helpers';
import { UsersQueryRepository } from '../users/usersQuery.repository';

@Injectable()
export class PostService {
  constructor(
    public postRepository: PostRepository,
    public postQueryRepository: PostQueryRepository,
    public blogQueryRepository: BlogQueryRepository,
    public helpers: Helpers,
    public usersQueryRepository: UsersQueryRepository,
  ) {}

  async deletePost(postId: string): Promise<boolean | null> {
    const isExistPost = await this.postQueryRepository.findPostById(postId);
    if (!isExistPost) return null;
    return await this.postRepository.deletePost(postId);
  }

  async createPost(
    createPostDto: CreatePostDto,
    blogId: string,
  ): Promise<ResultObject<string> | null> {
    await this.helpers.validateOrRejectModel(createPostDto, CreatePostDto);

    const foundBlog: BlogViewType | null =
      await this.blogQueryRepository.findBlogById(blogId);
    if (!foundBlog) return null;
    const postInputData: postInputDataModel = {
      title: createPostDto.title,
      shortDescription: createPostDto.shortDescription,
      content: createPostDto.content,
      blogId: blogId,
    };

    const newPost: PostDBModel = {
      _id: new ObjectId(),
      title: postInputData.title,
      shortDescription: postInputData.shortDescription,
      content: postInputData.content,
      blogId: postInputData.blogId,
      blogName: foundBlog.name,
      createdAt: new Date(),
    };
    return await this.postRepository.createPost(newPost);
  }

  async createPostForExistingBlog(
    blogId: string,
    postInputData: CreatePostDto,
  ): Promise<ResultObject<string> | null> {
    const foundBlog = await this.blogQueryRepository.findBlogById(blogId);
    if (!foundBlog) return null;
    await this.helpers.validateOrRejectModel(postInputData, CreatePostDto);

    const newPost: PostDBModel = {
      _id: new ObjectId(),
      title: postInputData.title,
      shortDescription: postInputData.shortDescription,
      content: postInputData.content,
      blogId: blogId,
      blogName: foundBlog!.name,
      createdAt: new Date(),
    };
    return await this.postRepository.createPost(newPost);
  }

  async updatePost(
    postId: string,
    updatedPostData: CreatePostDto,
  ): Promise<boolean | null> {
    await this.helpers.validateOrRejectModel(updatedPostData, CreatePostDto);

    const isExistPost = await this.postQueryRepository.findPostById(
      postId.toString(),
    );
    if (!isExistPost) return null;
    return await this.postRepository.updatePost(postId, updatedPostData);
  }

  async updatePostLikeStatusById(
    postId: string,
    newLikeStatusForComment: LikeStatusOption,
    userId: string,
  ) {
    const postInfo = await this.postRepository.getPostById(postId.toString());
    if (!postInfo) return null;
    const currentUser = await this.usersQueryRepository.findUserById(userId);

    const findPostLikeStatusInDB: LikeStatusDBType | null =
      await LikeStatusModel.findOne({
        entityId: postInfo._id,
        userId: new Types.ObjectId(currentUser!.id),
      });

    if (!findPostLikeStatusInDB) {
      await this.postRepository.createLikeStatusForPost(
        postInfo._id,
        new Types.ObjectId(currentUser!.id),
        currentUser!.login,
        newLikeStatusForComment,
      );
      return true;
    }
    await this.postRepository.updatePostLikeStatus(
      postInfo._id,
      new Types.ObjectId(currentUser!.id),
      newLikeStatusForComment,
    );

    return true;
  }
}
