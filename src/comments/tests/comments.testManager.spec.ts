import { ResultCode } from '../../helpers/heplersType';
import request from 'supertest';
import { postInputDataModelForExistingBlog } from '../../posts/post.types';
import { BlogInputModel } from '../../blogs/blogs.types';
import { blogsTestManager } from '../../blogs/test/blog.testManager.spec';
import { postsTestManager } from '../../posts/test/post.testManager.spec';
import { AuthTestManager } from '../../auth/tests/auth.testManager.spec';
import { createVasyaDataForRegistAndLogin } from '../../../test/test.helper';
import { LikeStatusOptionVariable } from '../comments.types';

export const CommentTestManager = {
  async createLikeStatusForComment(
    server: string,
    commentId: string,
    accessToken: string,
    likeStatus: LikeStatusOptionVariable,
    expectedStatusCode: ResultCode = ResultCode.NoContent,
  ) {
    const response = await request(server)
      .put(`comments/${commentId}/like-status`)
      .set({ Authorization: `Bearer ${accessToken}` })
      .send(likeStatus)
      .expect(expectedStatusCode);

    return response;
  },
  async createCommentWithBlogAndPost(
    httpServer: string,
    blogInputData: BlogInputModel,
    postsInputData: postInputDataModelForExistingBlog,
    userData: number,
    comment: string,
    expectedStatusCode: ResultCode = ResultCode.Created,
  ) {
    const createdBlog = await blogsTestManager.createBlog(
      httpServer,
      blogInputData,
    );
    const createdPost = await postsTestManager.createBlogAndPostForHim(
      httpServer,
      postsInputData,
      createdBlog.createdEntity.id,
    );
    await AuthTestManager.registrationUser(
      httpServer,
      createVasyaDataForRegistAndLogin(userData).registrationData,
    );
    const loginUserInfo = await AuthTestManager.loginUser(
      httpServer,
      createVasyaDataForRegistAndLogin(userData).loginData,
    );

    const commentText = { content: comment };

    const createdComment = await request(httpServer)
      .post(`/posts/${createdPost.createdEntity.id}/comments`)
      .set('Cookie', [loginUserInfo.refreshToken!])
      .set({ Authorization: `Bearer ${loginUserInfo.accessToken}` })
      .send(commentText)
      .expect(expectedStatusCode);
    console.log(createdComment.body);
    console.log('createdComment.body');

    expect(createdComment.body).toEqual({
      id: expect.any(String),
      content: comment,
      commentatorInfo: {
        userId: expect.any(String),
        userLogin:
          createVasyaDataForRegistAndLogin(userData).registrationData.login,
      },
      createdAt: expect.any(String),
      likesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: 'None',
      },
    });

    return {
      comment: createdComment.body,
      blog: createdBlog.createdEntity,
      post: createdPost.createdEntity,
      userLoginTokens: loginUserInfo,
    };
  },
};
