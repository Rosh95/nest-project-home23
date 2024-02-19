import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { appSettings } from '../../appSettings';
import request from 'supertest';
import { AppModule } from '../../app.module';
import { CreateUserDto } from '../../users/user.types';
import { AuthTestManager } from '../../auth/tests/auth.testManager.spec';
import { ResultCode } from '../../helpers/heplersType';
import { DbMongooseModule } from '../../modules/DbMongooseModule';
import { DbMongooseTestingMemoryModule } from '../../modules/DbMongooseTestingMemoryModule';
import { blogsTestManager } from '../../blogs/test/blog.testManager.spec';
import { BlogInputModel } from '../../blogs/blogs.types';
import { postsTestManager } from '../../posts/test/post.testManager.spec';
import { v4 } from 'uuid';
import { CommentTestManager } from './comments.testManager.spec';
import { createVasyaDataForRegistAndLogin } from '../../../test/test.helper';

jest.setTimeout(930000);

describe('CommentsController (e2e)', () => {
  let app: INestApplication;
  let httpServer;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideModule(DbMongooseModule)
      .useModule(DbMongooseTestingMemoryModule)
      .compile();

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

    const createVasyaData = (number: number) => {
      const registrationData: CreateUserDto = {
        login: `Vasya${number}`,
        email: `vasya${number}@gmail.ru`,
        password: '123456',
      };
      const loginData = {
        loginOrEmail: `Vasya${number}`,
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
        createVasyaData(2).registrationData,
      );
      const loginUserInfo = await AuthTestManager.loginUser(
        httpServer,
        createVasyaData(2).loginData,
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
          userLogin: createVasyaData(2).registrationData.login,
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
  });
});
