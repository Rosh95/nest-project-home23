import { Injectable } from '@nestjs/common';
import {
  CreatePostDto,
  PostDBModelSql,
  PostInputTypeToDBSql,
} from './post.types';
import { LikeStatusOption } from '../comments/comments.types';
import { LikeStatus, LikeStatusDocument } from '../likeStatus/likeStatus.type';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post, PostDocument } from './post.schema';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class PostRepositorySql {
  constructor(
    @InjectModel(Post.name) public postModel: Model<PostDocument>,
    @InjectModel(LikeStatus.name)
    public likeStatusModel: Model<LikeStatusDocument>,
    @InjectDataSource() protected dataSource: DataSource,
  ) {}

  async deletePost(postId: string): Promise<boolean> {
    const deletedPost = await this.dataSource.query(
      `
    DELETE FROM public."Posts"
    WHERE id = $1;
    `,
      [postId],
    );

    return deletedPost[1] ? true : false;
  }

  async createPost(newPost: PostInputTypeToDBSql): Promise<string> {
    await this.dataSource.query(
      `
        INSERT INTO public."Posts"(
        title, "shortDescription", content, "blogId")
        VALUES ($1, $2, $3, $4);
    `,
      [
        newPost.title,
        newPost.shortDescription,
        newPost.content,
        newPost.blogId,
      ],
    );

    const foundNewCreatedPost = await this.dataSource.query(
      `
        SELECT id, title, "shortDescription", content, "blogId", "createdAt"
        FROM public."Posts"
        WHERE title = $1  AND "shortDescription" = $2 AND "blogId" = $3
    `,
      [newPost.title, newPost.shortDescription, newPost.blogId],
    );

    return foundNewCreatedPost[0].id;
  }

  async getPostById(postId: string): Promise<PostDBModelSql | null> {
    const foundPost = await this.dataSource.query(
      `
        SELECT id, title, "shortDescription", content, "blogId", "createdAt"
        FROM public."Posts"
        WHERE id = $1
    `,
      [postId],
    );

    return foundPost[0];
  }

  async updatePost(
    postId: string,
    updatedPostData: CreatePostDto,
  ): Promise<boolean> {
    const updatedPosted = await this.dataSource.query(
      `
    UPDATE public."Posts"
    SET title= $2, "shortDescription"= $3, content= $4
    WHERE id = $1;
    `,
      [
        postId,
        updatedPostData.title,
        updatedPostData.shortDescription,
        updatedPostData.content,
      ],
    );
    return updatedPosted[1] ? true : false;
  }

  async findLikeStatusForPost(
    postId: string,
    userId: string,
  ): Promise<boolean> {
    const foundLikeStatus = await this.dataSource.query(
      `
      SELECT id, "postId", "userId", "likeStatus", "createdAt"
      FROM public."LikeStatusForPosts"
      WHERE "postId" = $1  AND "userId" = $2
    `,
      [postId, userId],
    );
    return foundLikeStatus[1] ? true : false;
  }

  async createLikeStatusForPost(
    postId: string,
    userId: string,
    likeStatus: LikeStatusOption,
  ) {
    await this.dataSource.query(
      `
    INSERT INTO public."LikeStatusForPosts"(
     "postId", "userId", "likeStatus")
    VALUES ($1, $2, $3);
    `,
      [postId, userId, likeStatus],
    );
    return true;
  }

  async updatePostLikeStatus(
    postId: string,
    userId: string,
    likeStatus: LikeStatusOption,
  ) {
    await this.dataSource.query(
      `
      UPDATE public."LikeStatusForPosts"
      SET  "likeStatus"= $3
      WHERE "postId" = $1 AND "userId" = $2 
    `,
      [postId, userId, likeStatus],
    );
    return true;
  }
}
