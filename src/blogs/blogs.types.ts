import { ObjectId } from 'mongodb';

export type BlogPostInputModel = {
  content: string;
  shortDescription: string;
  title: string;
};
export type BlogInputModel = {
  name: string;
  description: string;
  websiteUrl: string;
  // createdAt: string,
  // isMembership: boolean
};

export type BlogDbType = {
  _id: ObjectId;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: Date;
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
