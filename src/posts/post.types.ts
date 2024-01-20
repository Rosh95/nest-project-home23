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
import { Types } from 'mongoose';

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
    if (!Types.ObjectId.isValid(value)) {
      return false;
    }
    const result = await this.blogQueryRepository.findBlogById(value);
    return !!result;
  }

  defaultMessage(args: ValidationArguments) {
    console.log(args.value + 'args value');
    return 'Blog Doesn`t exist';
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
  //@IsMongoId()
  @Transform(({ value }: TransformFnParams) => value?.trim())
  //@Transform(({ value }: TransformFnParams) => Types.ObjectId.isValid(value))
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

export class CreateCommentDto {
  @IsNotEmpty()
  @IsString()
  @Length(20, 300)
  content: string;
}
