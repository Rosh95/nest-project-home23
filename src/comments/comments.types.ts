import { ObjectId } from 'mongodb';
import { IsIn } from 'class-validator';

export type CommentatorInfo = {
  userId: string;
  userLogin: string;
};

export type CommentsViewModel = {
  id: string;
  content: string;
  commentatorInfo: CommentatorInfo;
  createdAt: string;
  likesInfo: LikesInfoViewModel;
};
export type CommentsInputType = {
  content: string;
};

export enum LikeStatusOption {
  None = 'None',
  Like = 'Like',
  Dislike = 'Dislike',
}

export class LikeStatusOptionVariable {
  @IsIn([
    LikeStatusOption.None,
    LikeStatusOption.Dislike,
    LikeStatusOption.Like,
  ])
  likeStatus: LikeStatusOption;
}

export type LikesInfoViewModel = {
  likesCount: number;
  dislikesCount: number;
  myStatus: LikeStatusOption;
};

export type CommentsInputData = {
  content: string;
  userId: ObjectId;
  postId: string;
  userLogin: string;
};

export type PaginatorCommentViewType = {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: CommentsViewModel[];
};

// export const CommentsSchema = new mongoose.Schema<CommentsDBType>({
//   content: { type: String, require: true },
//   postId: { type: String, require: true },
//   createdAt: { type: Date, default: Date.now() },
//   commentatorInfo: {
//     userId: { type: ObjectId, require: true },
//     userLogin: { type: String, require: true, default: 'Unknown user' },
//   },
//   likesInfo: {
//     likesCount: { type: Number, require: true, default: 0 },
//     dislikesCount: { type: Number, require: true, default: 0 },
//     myStatus: {
//       type: String,
//       enum: LikeStatusOption,
//       require: true,
//       default: LikeStatusOption.None,
//     },
//   },
// });

export type CommentsDBType = {
  _id: ObjectId;
  content: string;
  commentatorInfo: CommentatorInfo;
  postId: string;
  createdAt: Date;
  likesInfo: LikesInfoViewModel;
};
