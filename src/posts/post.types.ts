import { ObjectId } from 'mongodb';
import { LikeStatusOption } from '../comments/comments.types';

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
export type postInputDataModelForExistingBlog = {
  title: string;
  shortDescription: string;
  content: string;
};
export type postInputUpdatedDataModel = {
  title: string;
  shortDescription: string;
  content: string;
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
