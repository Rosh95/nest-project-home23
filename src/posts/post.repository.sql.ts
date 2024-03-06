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
    const newPostId = await this.dataSource.query(
      `
        INSERT INTO public."Posts"(
        title, "shortDescription", content, "blogId")
        VALUES ($1, $2, $3, $4)
        RETURNING *
    `,
      [
        newPost.title,
        newPost.shortDescription,
        newPost.content,
        newPost.blogId,
      ],
    );

    return newPostId[0].id;
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
    WHERE id = $1
    RETURNING *
    `,
      [
        postId,
        updatedPostData.title,
        updatedPostData.shortDescription,
        updatedPostData.content,
      ],
    );
    return updatedPosted[0] ? true : false;
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
    return foundLikeStatus[0] ? true : false;
  }

  async createLikeStatusForPost(
    postId: string,
    userId: string,
    likeStatus: LikeStatusOption,
  ) {
    const newLikeStatus = await this.dataSource.query(
      `
    INSERT INTO public."LikeStatusForPosts"(
     "postId", "userId", "likeStatus")
     VALUES ($1, $2, $3)
     RETURNING *
    `,
      [postId, userId, likeStatus],
    );
    return !!newLikeStatus[0];
  }

  async updatePostLikeStatus(
    postId: string,
    userId: string,
    likeStatus: LikeStatusOption,
  ) {
    const updateLikeStatus = await this.dataSource.query(
      `
      UPDATE public."LikeStatusForPosts"
      SET  "likeStatus"= $3
      WHERE "postId" = $1 AND "userId" = $2 
      RETURNING *
    `,
      [postId, userId, likeStatus],
    );
    return !!updateLikeStatus[0];
  }
}
