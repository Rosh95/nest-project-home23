import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { appSettings } from '../../appSettings';
import request from 'supertest';
import { AppModule } from '../../app.module';
import { CreateUserDto } from '../../users/user.types';
import { AuthTestManager } from '../../auth/tests/auth.testManager.spec';
import { ResultCode } from '../../helpers/heplersType';
import { blogsTestManager } from '../../blogs/test/blog.testManager.spec';
import { BlogInputModel } from '../../blogs/blogs.types';
import { postsTestManager } from '../../posts/test/post.testManager.spec';
import { v4 } from 'uuid';
import { CommentTestManager } from './comments.testManager.spec';
import { createVasyaDataForRegistAndLogin } from '../../../test/test.helper';
import { LikeStatusOption } from '../comments.types';

jest.setTimeout(930000);

describe('CommentsController (e2e)', () => {
  let app: INestApplication;
  let httpServer;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    appSettings(app);

    await app.init();

    httpServer = app.getHttpServer();

    await request(httpServer).delete('/testing/all-data');
  });

  afterAll(async () => {
    await app.close();
  });
  beforeEach(async () => {
    await request(httpServer).delete('/testing/all-data');
  });

  describe('Comments router testing', () => {
    beforeEach(async () => {
      await request(httpServer).delete('/testing/all-data');
    });
    const createPostInputData = (num: number) => {
      return {
        title: `Whiplash ${num}`,
        shortDescription: `a feature screenplay synopsis by Damien Chazelle ${num}`,
        content: `A promising young drummerho will stop at nothing to realize a student’s potential. ${num}`,
      };
    };
    const createBlogInputData = (num: number) => {
      return {
        name: `Robert${num}`,
        description: `One small section contains a short description of the blog ${num}.`,
        websiteUrl: `https://vk${num}.com/`,
      };
    };
    const createIvanData = (number: number) => {
      const registrationData: CreateUserDto = {
        login: `Petya${number}`,
        email: `Petya${number}@gmail.ru`,
        password: '123456',
      };
      const loginData = {
        loginOrEmail: `Petya${number}`,
        password: '123456',
      };

      return { registrationData, loginData };
    };
    const blogInputData: BlogInputModel = {
      name: 'Robert',
      description:
        'One small section contains a short description of the blog.',
      websiteUrl: 'https://vk.com/',
    };
    const postsInputData = {
      title: 'Whiplash',
      shortDescription: 'a feature screenplay synopsis by Damien Chazelle',
      content:
        'A promising young drummer enrolls at a cut-throat music conservatory where his dreams of greatness are mentored by an instructor who will stop at nothing to realize a student’s potential.',
    };
    it('should create comment by comment  ', async () => {
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
        createIvanData(2).registrationData,
      );
      const loginUserInfo = await AuthTestManager.loginUser(
        httpServer,
        createIvanData(2).loginData,
      );

      const commentText =
        'Salam EveryOne. How Are you doing, man?? Let`s talk about football?';
      await request(httpServer)
        .post(`/posts/${v4()}/comments`)
        .set({ Authorization: `Bearer ${loginUserInfo.accessToken}` })
        .send({ content: commentText })
        .expect(ResultCode.NotFound);

      await request(httpServer)
        .post(`/posts/${createdPost.createdEntity.id}/comments`)
        .send({ content: commentText })
        .expect(ResultCode.Unauthorized);

      const createdComment = await request(httpServer)
        .post(`/posts/${createdPost.createdEntity.id}/comments`)
        .set('Cookie', [loginUserInfo.refreshToken!])
        .set({ Authorization: `Bearer ${loginUserInfo.accessToken}` })
        .send({ content: commentText })
        .expect(ResultCode.Created);

      expect(createdComment.body).toEqual({
        id: expect.any(String),
        content: commentText,
        commentatorInfo: {
          userId: expect.any(String),
          userLogin: createIvanData(2).registrationData.login,
        },
        createdAt: expect.any(String),
        likesInfo: {
          likesCount: 0,
          dislikesCount: 0,
          myStatus: 'None',
        },
      });
    });
    it('should get comment by id  ', async () => {
      const comment =
        'Salam EveryOne. How Are you doing, man?? Let`s talk about football?';
      const infoAboutNewComment =
        await CommentTestManager.createCommentWithBlogAndPost(
          httpServer,
          blogInputData,
          postsInputData,
          7,
          comment,
        );
      await request(httpServer)
        .get(`/comments/${v4()}`)
        .expect(ResultCode.NotFound);

      const getNewComment = await request(httpServer)
        .get(`/comments/${infoAboutNewComment.comment.id}`)
        .expect(ResultCode.Success);

      expect(getNewComment.body).toEqual({
        id: expect.any(String),
        content: comment,
        commentatorInfo: {
          userId: expect.any(String),
          userLogin: createVasyaDataForRegistAndLogin(7).registrationData.login,
        },
        createdAt: expect.any(String),
        likesInfo: {
          likesCount: 0,
          dislikesCount: 0,
          myStatus: 'None',
        },
      });
    });
    it(
      'PUT -> "/comments/:commentId/like-status": create comment then: ' +
        'like the comment by user 1, user 2, user 3, user 4. ',
      async () => {
        const comment =
          'Salam EveryOne. How Are you doing, man?? Let`s talk about football?';
        const infoAboutNewComment =
          await CommentTestManager.createCommentWithBlogAndPost(
            httpServer,
            createBlogInputData(14),
            createPostInputData(14),
            14,
            comment,
          );
        await AuthTestManager.registrationUser(
          httpServer,
          createIvanData(1).registrationData,
        );
        const loginUser1Info = await AuthTestManager.loginUser(
          httpServer,
          createIvanData(1).loginData,
        );
        await AuthTestManager.registrationUser(
          httpServer,
          createIvanData(2).registrationData,
        );
        const loginUser2Info = await AuthTestManager.loginUser(
          httpServer,
          createIvanData(2).loginData,
        );
        await AuthTestManager.registrationUser(
          httpServer,
          createIvanData(3).registrationData,
        );
        const loginUser3Info = await AuthTestManager.loginUser(
          httpServer,
          createIvanData(3).loginData,
        );
        await AuthTestManager.registrationUser(
          httpServer,
          createIvanData(4).registrationData,
        );
        const loginUser4Info = await AuthTestManager.loginUser(
          httpServer,
          createIvanData(4).loginData,
        );
        await CommentTestManager.createLikeStatusForComment(
          httpServer,
          infoAboutNewComment.comment.id,
          loginUser1Info.accessToken,
          { likeStatus: LikeStatusOption.Like },
        );

        const getNewCommentAfterFirstLike = await request(httpServer)
          .get(`/comments/${infoAboutNewComment.comment.id}`)
          .set({
            Authorization: `Bearer ${loginUser1Info.accessToken}`,
          })
          .expect(ResultCode.Success);
        console.log(
          'getNewCommentAfterFirstLike' + getNewCommentAfterFirstLike,
        );

        await CommentTestManager.createLikeStatusForComment(
          httpServer,
          infoAboutNewComment.comment.id,
          loginUser2Info.accessToken,
          { likeStatus: LikeStatusOption.Like },
        );

        const getNewCommentAfterSecondLike = await request(httpServer)
          .get(`/comments/${infoAboutNewComment.comment.id}`)
          .set({
            Authorization: `Bearer ${loginUser1Info.accessToken}`,
          })
          .expect(ResultCode.Success);
        console.log(
          'getNewCommentAfterSecondLike' + getNewCommentAfterSecondLike,
        );
        await CommentTestManager.createLikeStatusForComment(
          httpServer,
          infoAboutNewComment.comment.id,
          loginUser3Info.accessToken,
          { likeStatus: LikeStatusOption.Like },
        );
        const getNewCommentAfterThirdLike = await request(httpServer)
          .get(`/comments/${infoAboutNewComment.comment.id}`)
          .set({
            Authorization: `Bearer ${loginUser1Info.accessToken}`,
          })
          .expect(ResultCode.Success);
        console.log(
          'getNewCommentAfterThirdLike' + getNewCommentAfterThirdLike,
        );

        await CommentTestManager.createLikeStatusForComment(
          httpServer,
          infoAboutNewComment.comment.id,
          loginUser4Info.accessToken,
          { likeStatus: LikeStatusOption.Like },
        );
        const getNewCommentAfterFourthLike = await request(httpServer)
          .get(`/comments/${infoAboutNewComment.comment.id}`)
          .set({
            Authorization: `Bearer ${loginUser1Info.accessToken}`,
          })
          .expect(ResultCode.Success);
        console.log(
          'getNewCommentAfterFourthLike' + getNewCommentAfterFourthLike,
        );
      },
    );
  });
});
