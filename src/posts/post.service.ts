import { Injectable } from '@nestjs/common';
import { PostRepository } from './post.repository';
import { PostQueryRepository } from './postQuery.repository';
import { BlogViewType } from '../blogs/blogs.types';
import { ObjectId } from 'mongodb';
import { BlogQueryRepository } from '../blogs/blogQuery.repository';
import {
  PostDBModel,
  postInputDataModel,
  postInputDataModelForExistingBlog,
  postInputUpdatedDataModel,
} from './post.types';
import { ResultObject } from '../helpers/heplersType';
import { NewUsersDBType } from '../users/user.types';
import { LikeStatusOption } from '../comments/comments.types';
import { LikeStatusDBType } from '../likeStatus/likeStatus.type';
import { LikeStatusModel } from '../db/dbMongo';

@Injectable()
export class PostService {
  constructor(
    public postRepository: PostRepository,
    public postQueryRepository: PostQueryRepository,
    public blogQueryRepository: BlogQueryRepository,
  ) {}

  async deletePost(id: string): Promise<boolean> {
    return await this.postRepository.deletePost(id);
  }

  async createPost(
    postInputData: postInputDataModel,
    foundBlog: BlogViewType,
  ): Promise<ResultObject<string>> {
    //  const user = userRepository.findUserById('')
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
    //query reto get
  }

  async createPostForExistingBlog(
    blogId: string,
    postInputData: postInputDataModelForExistingBlog,
  ): Promise<ResultObject<string>> {
    const foundBlog = await this.blogQueryRepository.findBlogById(blogId);

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
    updatedPostData: postInputUpdatedDataModel,
  ): Promise<boolean> {
    return await this.postRepository.updatePost(postId, updatedPostData);
  }

  async updatePostLikeStatusById(
    postInfo: PostDBModel,
    newLikeStatusForComment: LikeStatusOption,
    currentUser: NewUsersDBType,
  ) {
    const findPostLikeStatusInDB: LikeStatusDBType | null =
      await LikeStatusModel.findOne({
        entityId: postInfo._id,
        userId: currentUser._id,
      });

    if (!findPostLikeStatusInDB) {
      await this.postRepository.createLikeStatusForPost(
        postInfo._id,
        currentUser._id,
        currentUser.accountData.login,
        newLikeStatusForComment,
      );
      return true;
    }
    await this.postRepository.updatePostLikeStatus(
      postInfo._id,
      currentUser._id,
      newLikeStatusForComment,
    );

    //findLikeStatusInDB.likeStatus = newLikeStatusForComment;

    return true;
    // return commentRepository.updatedCommentLikeStatusById(commentInfo._id.toString(), newLikeStatusForComment)
  }
}
