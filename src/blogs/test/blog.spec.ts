import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../app.module';
import { appSettings } from '../../appSettings';
import { blogsTestManager } from './blog.testManager.spec';
import { BlogInputModel } from '../blogs.types';
import { postsTestManager } from '../../posts/test/post.testManager.spec';
import { CreateUserDto } from '../../users/user.types';
import { AuthTestManager } from '../../auth/tests/auth.testManager.spec';
import { LikeStatusOption } from '../../comments/comments.types';
import { ResultCode } from '../../helpers/heplersType';
jest.setTimeout(95000);

const blogInputData: BlogInputModel = {
  name: 'Robert',
  description: 'One small section contains a short description of the blog.',
  websiteUrl: 'https://vk.com/',
};
// const blogInputData2: BlogInputModel = {
//   name: 'Kamil',
//   description:
//     'A blog description or Meta description is a short piece of text',
//   websiteUrl: 'https://yandex.com/',
// };
const createPostInputData = (num: number) => {
  return {
    title: `Whiplash ${num}`,
    shortDescription: `a feature screenplay synopsis by Damien Chazelle ${num}`,
    content: `A promising young drummerho will stop at nothing to realize a student’s potential. ${num}`,
  };
};
const postsInputData = {
  title: 'Whiplash',
  shortDescription: 'a feature screenplay synopsis by Damien Chazelle',
  content:
    'A promising young drummerho will stop at nothing to realize a student’s potential.',
};

const createPetyaData = (number: number) => {
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

describe('BlogController (e2e)', () => {
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

    // await request(httpServer).delete('/testing/all-data');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Blogs router GET method', () => {
    // beforeAll(async () => {
    //   await request(httpServer).delete('/testing/all-data');
    // });
    it('should return 200 and empty array blogs', async () => {
      await request(httpServer)
        .get('/sa/blogs')
        .auth('admin', 'qwerty')
        .expect(200, {
          pagesCount: 0,
          page: 1,
          pageSize: 10,
          totalCount: 0,
          items: [],
        });
    });
    it('should get blog by id', async () => {
      const result = await blogsTestManager.createBlog(httpServer, {
        ...blogInputData,
        name: 'John',
      });
      const getBlogResponse = await request(httpServer)
        .get(`/sa/blogs/${result.createdEntity.id}`)
        .auth('admin', 'qwerty');
      expect(getBlogResponse.status).toBe(200);
      const blogFromAPi = getBlogResponse.body;
      expect(blogFromAPi).toEqual(result.response.body);
    });
    it('should get non-existent blog and return 404', async () => {
      const randomNumber = '6348acd2e1a47ca32e79f46f';
      const getBlogResponse = await request(httpServer)
        .get(`/sa/blogs/${randomNumber}`)
        .auth('admin', 'qwerty');
      expect(getBlogResponse.status).toBe(404);
    });
    it('should get post by blog id', async () => {
      const result = await blogsTestManager.createBlog(
        httpServer,
        blogInputData,
      );
      const post = await postsTestManager.createBlogAndPostForHim(
        httpServer,
        postsInputData,
        result.createdEntity.id,
        201,
      );

      const randomNumber = '6348acd2e1a47ca32e79f46f';
      const getWrongBlogResponse = await request(httpServer).get(
        `/sa/blogs/${randomNumber}/posts`,
      );
      expect(getWrongBlogResponse.status).toBe(404);

      const getBlogResponse = await request(httpServer).get(
        `/sa/blogs/${result.createdEntity.id}/posts`,
      );
      expect(getBlogResponse.status).toBe(200);
      const blogFromAPi = getBlogResponse.body;
      expect(blogFromAPi).toEqual({
        pagesCount: 1,
        page: 1,
        pageSize: 10,
        totalCount: 1,
        items: [post.createdEntity],
      });
    });
    it('GET -> "/blogs/:blogId/posts": create 6 posts ', async () => {
      const createdBlog = await blogsTestManager.createBlog(
        httpServer,
        blogInputData,
      );
      const post1 = await postsTestManager.createBlogAndPostForHimFromBlog(
        httpServer,
        createPostInputData(1),
        createdBlog.createdEntity.id,
        201,
      );
      const post2 = await postsTestManager.createBlogAndPostForHimFromBlog(
        httpServer,
        createPostInputData(2),
        createdBlog.createdEntity.id,
        201,
      );
      const post3 = await postsTestManager.createBlogAndPostForHimFromBlog(
        httpServer,
        createPostInputData(3),
        createdBlog.createdEntity.id,
        201,
      );
      const post4 = await postsTestManager.createBlogAndPostForHimFromBlog(
        httpServer,
        createPostInputData(4),
        createdBlog.createdEntity.id,
        201,
      );
      const post5 = await postsTestManager.createBlogAndPostForHimFromBlog(
        httpServer,
        createPostInputData(5),
        createdBlog.createdEntity.id,
        201,
      );
      const post6 = await postsTestManager.createBlogAndPostForHimFromBlog(
        httpServer,
        createPostInputData(6),
        createdBlog.createdEntity.id,
        201,
      );
      await AuthTestManager.registrationUser(
        httpServer,
        createPetyaData(1).registrationData,
      );
      const loginUser1Info = await AuthTestManager.loginUser(
        httpServer,
        createPetyaData(1).loginData,
      );
      await AuthTestManager.registrationUser(
        httpServer,
        createPetyaData(2).registrationData,
      );
      const loginUser2Info = await AuthTestManager.loginUser(
        httpServer,
        createPetyaData(2).loginData,
      );
      await AuthTestManager.registrationUser(
        httpServer,
        createPetyaData(3).registrationData,
      );
      const loginUser3Info = await AuthTestManager.loginUser(
        httpServer,
        createPetyaData(3).loginData,
      );
      await AuthTestManager.registrationUser(
        httpServer,
        createPetyaData(4).registrationData,
      );
      const loginUser4Info = await AuthTestManager.loginUser(
        httpServer,
        createPetyaData(4).loginData,
      );
      await AuthTestManager.registrationUser(
        httpServer,
        createPetyaData(5).registrationData,
      );
      const loginUser5Info = await AuthTestManager.loginUser(
        httpServer,
        createPetyaData(5).loginData,
      );
      await AuthTestManager.registrationUser(
        httpServer,
        createPetyaData(6).registrationData,
      );
      const loginUser6Info = await AuthTestManager.loginUser(
        httpServer,
        createPetyaData(6).loginData,
      );
      await AuthTestManager.putLikeStatusForPost(
        httpServer,
        post1.createdEntity.id,
        { likeStatus: LikeStatusOption.Like },
        loginUser1Info.accessToken,
        ResultCode.NoContent,
      );
      await AuthTestManager.putLikeStatusForPost(
        httpServer,
        post1.createdEntity.id,
        { likeStatus: LikeStatusOption.Like },
        loginUser2Info.accessToken,
        ResultCode.NoContent,
      );
      await AuthTestManager.putLikeStatusForPost(
        httpServer,
        post2.createdEntity.id,
        { likeStatus: LikeStatusOption.Like },
        loginUser2Info.accessToken,
        ResultCode.NoContent,
      );
      await AuthTestManager.putLikeStatusForPost(
        httpServer,
        post2.createdEntity.id,
        { likeStatus: LikeStatusOption.Like },
        loginUser3Info.accessToken,
        ResultCode.NoContent,
      );
      await AuthTestManager.putLikeStatusForPost(
        httpServer,
        post3.createdEntity.id,
        { likeStatus: LikeStatusOption.Dislike },
        loginUser1Info.accessToken,
        ResultCode.NoContent,
      );
      await AuthTestManager.putLikeStatusForPost(
        httpServer,
        post4.createdEntity.id,
        { likeStatus: LikeStatusOption.Like },
        loginUser1Info.accessToken,
        ResultCode.NoContent,
      );
      await AuthTestManager.putLikeStatusForPost(
        httpServer,
        post4.createdEntity.id,
        { likeStatus: LikeStatusOption.Like },
        loginUser4Info.accessToken,
        ResultCode.NoContent,
      );
      await AuthTestManager.putLikeStatusForPost(
        httpServer,
        post4.createdEntity.id,
        { likeStatus: LikeStatusOption.Like },
        loginUser2Info.accessToken,
        ResultCode.NoContent,
      );
      await AuthTestManager.putLikeStatusForPost(
        httpServer,
        post4.createdEntity.id,
        { likeStatus: LikeStatusOption.Like },
        loginUser3Info.accessToken,
        ResultCode.NoContent,
      );
      await AuthTestManager.putLikeStatusForPost(
        httpServer,
        post5.createdEntity.id,
        { likeStatus: LikeStatusOption.Like },
        loginUser2Info.accessToken,
        ResultCode.NoContent,
      );
      await AuthTestManager.putLikeStatusForPost(
        httpServer,
        post5.createdEntity.id,
        { likeStatus: LikeStatusOption.Dislike },
        loginUser3Info.accessToken,
        ResultCode.NoContent,
      );
      await AuthTestManager.putLikeStatusForPost(
        httpServer,
        post6.createdEntity.id,
        { likeStatus: LikeStatusOption.Like },
        loginUser1Info.accessToken,
        ResultCode.NoContent,
      );
      await AuthTestManager.putLikeStatusForPost(
        httpServer,
        post6.createdEntity.id,
        { likeStatus: LikeStatusOption.Dislike },
        loginUser2Info.accessToken,
        ResultCode.NoContent,
      );

      console.log({
        createdBlog: createdBlog.createdEntity.id,
        post1: post1.createdEntity.id,
        loginUser1Info: loginUser1Info,
        post2: post2.createdEntity.id,
        loginUser2Info: loginUser2Info,
        post3: post3.createdEntity.id,
        loginUser3Info: loginUser3Info,
        post4: post4.createdEntity.id,
        loginUser4Info: loginUser4Info,
        post5: post5.createdEntity.id,
        loginUser5Info: loginUser5Info,
        post6: post6.createdEntity.id,
        loginUser6Info: loginUser6Info,
      });

      // const getBlogResponse = await request(httpServer).get(
      //   `/sa/blogs/${createdBlog.createdEntity.id}/posts`,
      // );
      // expect(getBlogResponse.status).toBe(200);
      // const blogFromAPi = getBlogResponse.body;
      // expect(blogFromAPi).toEqual({
      //   pagesCount: 1,
      //   page: 1,
      //   pageSize: 10,
      //   totalCount: 6,
      //   items: [
      //     post6.createdEntity,
      //     post5.createdEntity,
      //     post4.createdEntity,
      //     post3.createdEntity,
      //     post2.createdEntity,
      //     post1.createdEntity,
      //   ],
      // });
    });
  });

  describe('Blogs router DELETE method', () => {
    beforeAll(async () => {
      await request(httpServer).delete('/testing/all-data');
    });
    it('should delete unexciting blog by id and return 404', async () => {
      const randomNumber = '6348acd2e1a47ca32e79f46f';
      await request(httpServer)
        .delete(`/sa/blogs/${randomNumber}`)
        .auth('admin', 'qwerty')
        .expect(404);
    });
    it('should delete  blog by id unauthorized and return 401 ', async () => {
      const randomNumber = '6348acd2e1a47ca32e79f46f';
      await request(httpServer).delete(`/sa/blogs/${randomNumber}`).expect(401);
    });
    it('should delete blog by id', async () => {
      const result = await blogsTestManager.createBlog(
        httpServer,
        blogInputData,
      );
      await request(httpServer)
        .delete('/sa/blogs/' + result.createdEntity.id)
        .auth('admin', 'qwerty')
        .expect(204);

      await request(httpServer)
        .get('/sa/blogs')
        .auth('admin', 'qwerty')
        .expect(200, {
          pagesCount: 0,
          page: 1,
          pageSize: 10,
          totalCount: 0,
          items: [],
        });
    });
  });

  describe('Blogs router POST method', () => {
    beforeAll(async () => {
      await request(httpServer).delete('/testing/all-data');
    });
    it('try add post by unauthorized user and return 401', async () => {
      const blogInputData = {
        name: 'Vasyliy Pupkin',
        websiteUrl: 'https://vk.com/55',
        description: 'teacher',
      };
      await request(httpServer)
        .post('/sa/blogs')
        .send(blogInputData)
        .expect(401);
    });
    it('should return 201 status and add new blog', async () => {
      await blogsTestManager.createBlog(httpServer, blogInputData);
    });
    it('try add new blog with wrong data and get 400', async () => {
      const blogInputData = {
        name: 'Vasyliy Pupkin',
        websiteUrl: 'httppppps://vk.com/55',
        description: 'teacher',
        createdAt: new Date().toISOString(),
        isMembership: false,
      };
      await blogsTestManager.createBlog(httpServer, blogInputData, 400);
    });
    it('should post a new post for current blog id', async () => {
      const result = await blogsTestManager.createBlog(
        httpServer,
        blogInputData,
      );
      const randomNumber = '6348acd2e1a47ca32e79f46f';
      const dataPost = {
        title: postsInputData.title,
        shortDescription: postsInputData.shortDescription,
        content: postsInputData.content,
        blogId: result.createdEntity.id,
      };
      await request(httpServer)
        .post(`/sa/blogs/${result.createdEntity.id}/posts`)
        .send(dataPost)
        .expect(401);
      await request(httpServer)
        .post(`/sa/blogs/${randomNumber}/posts`)
        .auth('admin', 'qwerty')
        .send(dataPost)
        .expect(404);

      const resp = await request(httpServer)
        .post(`/sa/blogs/${result.createdEntity.id}/posts`)
        .auth('admin', 'qwerty')
        .send(dataPost)
        .expect(201);
      console.log('here!!!!', resp.body);

      expect(resp.body).toEqual({
        id: expect.any(String),
        title: dataPost.title,
        shortDescription: dataPost.shortDescription,
        content: dataPost.content,
        blogId: result.createdEntity.id,
        blogName: result.createdEntity.name,
        createdAt: expect.any(String),
        extendedLikesInfo: {
          dislikesCount: 0,
          likesCount: 0,
          myStatus: 'None',
          newestLikes: [],
        },
      });
    });
  });

  describe('Blogs router PUT method', () => {
    beforeAll(async () => {
      await request(httpServer).delete('/testing/all-data');
    });
    it('should return 204 status and  change blog', async () => {
      const result = await blogsTestManager.createBlog(
        httpServer,
        blogInputData,
      );
      const resp = await request(httpServer)
        .put('/sa/blogs/' + result.createdEntity.id)
        .auth('admin', 'qwerty')
        .send({
          name: 'Nikolay Durov',
          websiteUrl: 'https://vk.com',
          description: 'it programming man',
          createdAt: new Date().toISOString(),
          isMembership: false,
        });
      expect(resp.status).toBe(204);
      const updateBlogInputData = {
        id: result.createdEntity.id,
        name: 'Nikolay Durov',
        websiteUrl: 'https://vk.com',
        description: 'it programming man',
        createdAt: result.createdEntity.createdAt,
        isMembership: false,
      };

      await request(httpServer)
        .get('/sa/blogs')
        .auth('admin', 'qwerty')
        .expect(200, {
          pagesCount: 1,
          page: 1,
          pageSize: 10,
          totalCount: 1,
          items: [updateBlogInputData],
        });
    });
    it('try change blog unauthorized and return 401', async () => {
      const result = await blogsTestManager.createBlog(
        httpServer,
        blogInputData,
      );
      const resp = await request(httpServer)
        .put('/sa/blogs/' + result.createdEntity.id)
        .send({
          name: 'Nikolay Durov',
          websiteUrl: 'https://vk.com',
          description: 'it programming man',
        });
      expect(resp.status).toBe(401);
    });
    it('should return 400 status and try change blog by wrong data', async () => {
      const result = await blogsTestManager.createBlog(
        httpServer,
        blogInputData,
      );
      const resp = await request(httpServer)
        .put('/sa/blogs/' + result.createdEntity.id)
        .auth('admin', 'qwerty')
        .send({
          name: 'Nikolay Durov',
          websiteUrl: 'httjkdfngaps://vk.com',
          description: 'it programming man',
        });
      expect(resp.status).toBe(400);
    });
    it('try change non-exist blog and return 404', async () => {
      const randomNumber = '6348acd2e1a47ca32e79f46f';
      const resp = await request(httpServer)
        .put(`/sa/blogs/${randomNumber}`)
        .auth('admin', 'qwerty')
        .send({
          name: 'Nikolay Durov',
          websiteUrl: 'https://vk.com',
          description: 'it programming man',
        });
      expect(resp.status).toBe(404);
    });
  });
});
