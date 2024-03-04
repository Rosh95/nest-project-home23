import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { Types } from 'mongoose';
import { Transform, TransformFnParams } from 'class-transformer';

export type BlogInputModel = {
  name: string;
  description: string;
  websiteUrl: string;
  // createdAt: string,
  // isMembership: boolean
};

export type BlogDbType = {
  _id: Types.ObjectId;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: Date;
  isMembership: boolean;
};
export type BlogDbTypeSql = {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: string;
  isMembership: boolean;
};

export type BlogViewType = {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: string;
  isMembership: boolean;
};

export type PaginatorBlogViewType = {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: BlogViewType[];
};

export class CreateBlogDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }: TransformFnParams) => value?.trim())
  @Length(1, 15)
  name: string;

  @IsNotEmpty()
  @IsString()
  @Transform(({ value }: TransformFnParams) => value?.trim())
  @Length(1, 500)
  description: string;

  @IsNotEmpty()
  @IsString()
  @Length(1, 100)
  @Transform(({ value }: TransformFnParams) => value?.trim())
  @Matches(
    '^https://([a-zA-Z0-9_-]+\\.)+[a-zA-Z0-9_-]+(\\/[a-zA-Z0-9_-]+)*\\/?$',
  )
  websiteUrl: string;
}
