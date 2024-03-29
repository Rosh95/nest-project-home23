import { Injectable } from '@nestjs/common';
import { PostRepository } from './post.repository';
import { PostQueryRepository } from './postQuery.repository';
import { BlogQueryRepository } from '../blogs/blogQuery.repository';
import { LikeStatus, LikeStatusDocument } from '../likeStatus/likeStatus.type';
import { Model } from 'mongoose';
import { Helpers } from '../helpers/helpers';
import { UsersQueryRepository } from '../users/usersQuery.repository';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class PostService {
  constructor(
    public postRepository: PostRepository,
    public postQueryRepository: PostQueryRepository,
    public blogQueryRepository: BlogQueryRepository,
    public helpers: Helpers,
    public usersQueryRepository: UsersQueryRepository,
    @InjectModel(LikeStatus.name)
    public likeStatusModel: Model<LikeStatusDocument>,
  ) {}

  // async deletePost(postId: string): Promise<ResultObject<string>> {
  //   if (!postId) {
  //     return {
  //       data: null,
  //       resultCode: ResultCode.NotFound,
  //       message: 'couldn`t find blog',
  //     };
  //   }
  //
  //   const isExistPost = await this.postQueryRepository.findPostById(postId);
  //   if (!isExistPost) {
  //     return {
  //       data: null,
  //       resultCode: ResultCode.NotFound,
  //       message: 'couldn`t find post',
  //     };
  //   }
  //   const isDeleted = await this.postRepository.deletePost(postId);
  //   if (!isDeleted) {
  //     return {
  //       data: null,
  //       resultCode: ResultCode.BadRequest,
  //       message: 'couldn`t delete post',
  //     };
  //   }
  //   return {
  //     data: 'ok',
  //     resultCode: ResultCode.NoContent,
  //   };
  // }

  // async createPost(
  //   createPostDto: CreatePostDto,
  //   blogId: string,
  // ): Promise<ResultObject<string>> {
  //   await this.helpers.validateOrRejectModel(createPostDto, CreatePostDto);
  //
  //   const foundBlog: BlogViewType | null =
  //     await this.blogQueryRepository.findBlogById(blogId);
  //   if (!foundBlog) {
  //     const error: ResultObject<string> = {
  //       data: null,
  //       resultCode: ResultCode.BadRequest,
  //       message: 'couldn`t find this blog',
  //     };
  //     return error;
  //   }
  //   const newPost: PostDBModel = {
  //     _id: new ObjectId(),
  //     title: createPostDto.title,
  //     shortDescription: createPostDto.shortDescription,
  //     content: createPostDto.content,
  //     blogId: blogId,
  //     blogName: foundBlog.name,
  //     createdAt: new Date(),
  //   };
  //   const createdPostId = await this.postRepository.createPost(newPost);
  //   if (createdPostId) {
  //     const result: ResultObject<string> = {
  //       data: createdPostId,
  //       resultCode: ResultCode.Created,
  //     };
  //
  //     return result;
  //   }
  //   return {
  //     data: null,
  //     resultCode: ResultCode.BadRequest,
  //     message: 'couldn`t create a new post',
  //   };
  // }

  // async createPostForExistingBlog(
  //   blogId: string,
  //   postInputData: CreatePostDto,
  // ): Promise<ResultObject<string>> {
  //   const foundBlog = await this.blogQueryRepository.findBlogById(blogId);
  //   if (!foundBlog) {
  //     return {
  //       data: null,
  //       resultCode: ResultCode.NotFound,
  //       message: 'couldn`t find blog',
  //     };
  //   }
  //   await this.helpers.validateOrRejectModel(postInputData, CreatePostDto);
  //
  //   const newPost: PostDBModel = {
  //     _id: new ObjectId(),
  //     title: postInputData.title,
  //     shortDescription: postInputData.shortDescription,
  //     content: postInputData.content,
  //     blogId: blogId,
  //     blogName: foundBlog.name,
  //     createdAt: new Date(),
  //   };
  //   const createdPostId = await this.postRepository.createPost(newPost);
  //   return {
  //     data: createdPostId,
  //     resultCode: ResultCode.Created,
  //   };
  // }

  // async updatePost(
  //   postId: string,
  //   updatedPostData: CreatePostDto,
  // ): Promise<ResultObject<string>> {
  //   await this.helpers.validateOrRejectModel(updatedPostData, CreatePostDto);
  //
  //   const isExistPost = await this.postQueryRepository.findPostById(
  //     postId.toString(),
  //   );
  //   if (!isExistPost) {
  //     return {
  //       data: null,
  //       resultCode: ResultCode.NotFound,
  //       message: 'couldn`t find blog',
  //     };
  //   }
  //   const updatedPost = await this.postRepository.updatePost(
  //     postId,
  //     updatedPostData,
  //   );
  //   if (!updatedPost) {
  //     return {
  //       data: null,
  //       resultCode: ResultCode.BadRequest,
  //       message: 'couldn`t update blog',
  //     };
  //   }
  //   return {
  //     data: 'ok',
  //     resultCode: ResultCode.NoContent,
  //   };
  // }

  // async updatePostLikeStatusById(
  //   postId: string,
  //   newLikeStatusForComment: LikeStatusOption,
  //   userId: string,
  // ): Promise<ResultObject<string>> {
  //   const postInfo = await this.postRepository.getPostById(postId.toString());
  //   if (!postInfo) {
  //     return {
  //       data: null,
  //       resultCode: ResultCode.NotFound,
  //       message: 'couldn`t find post',
  //     };
  //   }
  //   const currentUser = await this.usersQueryRepository.findUserById(userId);
  //   if (!currentUser) {
  //     return {
  //       data: null,
  //       resultCode: ResultCode.Unauthorized,
  //       message: 'couldn`t find User',
  //     };
  //   }
  //
  //   const findPostLikeStatusInDB: LikeStatusDBType | null =
  //     await this.likeStatusModel.findOne({
  //       entityId: postInfo._id,
  //       userId: new Types.ObjectId(currentUser!.id),
  //     });
  //
  //   if (!findPostLikeStatusInDB) {
  //     await this.postRepository.createLikeStatusForPost(
  //       postInfo._id,
  //       new Types.ObjectId(currentUser!.id),
  //       currentUser!.login,
  //       newLikeStatusForComment,
  //     );
  //     return {
  //       data: 'ok',
  //       resultCode: ResultCode.NoContent,
  //     };
  //   }
  //   await this.postRepository.updatePostLikeStatus(
  //     postInfo._id,
  //     new Types.ObjectId(currentUser!.id),
  //     newLikeStatusForComment,
  //   );
  //
  //   return {
  //     data: 'ok',
  //     resultCode: ResultCode.NoContent,
  //   };
  // }
}
