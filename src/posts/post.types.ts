import { ObjectId } from 'mongodb';
import { LikeStatusOption } from '../comments/comments.types';
import {
  IsNotEmpty,
  IsString,
  Length,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Transform, TransformFnParams } from 'class-transformer';
import { Injectable } from '@nestjs/common';
import { BlogQueryRepository } from '../blogs/blogQuery.repository';
import { PostQueryRepository } from './postQuery.repository';

export type PostLikesUsersModel = {
  addedAt: string;
  userId: string;
  login: string;
};

export type PostViewModel = {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string | null;
  createdAt: string;
  extendedLikesInfo: {
    likesCount: number;
    dislikesCount: number;
    myStatus: LikeStatusOption;
    newestLikes: PostLikesUsersModel[];
  };
};

export type PostDBModel = {
  _id: ObjectId;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string | null;
  createdAt: Date;
};
export type postInputType = {
  id?: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: string;
};
export type postInputDataModel = {
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
};

export type PaginatorPostViewType = {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: PostViewModel[];
};

// export const PostSchema = new mongoose.Schema<PostDBModel>({
//   title: { type: String, require: true },
//   shortDescription: { type: String, require: true },
//   content: { type: String, require: true },
//   blogId: { type: String, require: true },
//   blogName: { type: String, require: true },
//   createdAt: { type: Date, default: Date.now() },
// });
//Todo make it if we have another error, error about blogId id doesn`t work.
@ValidatorConstraint({ name: 'BlogExists', async: true })
@Injectable()
export class BlogExistsRule implements ValidatorConstraintInterface {
  constructor(private blogQueryRepository: BlogQueryRepository) {}

  async validate(value: string) {
    try {
      const result = await this.blogQueryRepository.findBlogById(value);
      console.log(result + 'result!!');
    } catch (e) {
      console.log(e);
      return false;
    }
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    console.log(args.value + 'args value');
    return 'Blog Doesn`t exist';
  }
}
// Todo why false not breaking function
@ValidatorConstraint({ name: 'PostsExists', async: true })
@Injectable()
export class PostExistsRule implements ValidatorConstraintInterface {
  constructor(private postQueryRepository: PostQueryRepository) {}
  async validate(value: string) {
    try {
      const result = await this.postQueryRepository.findPostById(value);
      console.log(result + 'result!!');
    } catch (e) {
      console.log(e);
      return false;
    }
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    console.log(args.value + 'args');
    return 'Post Doesn`t exist';
  }
}

export class CreatePostDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }: TransformFnParams) => value?.trim())
  @Length(1, 30)
  title: string;

  @IsNotEmpty()
  @IsString()
  @Transform(({ value }: TransformFnParams) => value?.trim())
  @Length(1, 100)
  shortDescription: string;

  @IsNotEmpty()
  @IsString()
  @Transform(({ value }: TransformFnParams) => value?.trim())
  @Length(1, 1000)
  content: string;
}

export class CreatePostWithBlogIdDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }: TransformFnParams) => value?.trim())
  @Validate(BlogExistsRule)
  blogId: string;

  @IsNotEmpty()
  @IsString()
  @Transform(({ value }: TransformFnParams) => value?.trim())
  @Length(1, 30)
  title: string;

  @IsNotEmpty()
  @IsString()
  @Transform(({ value }: TransformFnParams) => value?.trim())
  @Length(1, 100)
  shortDescription: string;

  @IsNotEmpty()
  @IsString()
  @Transform(({ value }: TransformFnParams) => value?.trim())
  @Length(1, 1000)
  content: string;
}
export class PostIdDto {
  // @Transform(({ value }: TransformFnParams) => value?.trim())
  @Validate(PostExistsRule)
  postId: string;
}

export class CreateCommentDto {
  @IsNotEmpty()
  @IsString()
  @Length(20, 300)
  content: string;
}
