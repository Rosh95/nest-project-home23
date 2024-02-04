import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { appSettings } from '../../appSettings';
import request from 'supertest';
import { blogsTestManager } from '../../blogs/test/blog.testManager.spec';
import { postsTestManager } from './post.testManager.spec';
import { BlogInputModel } from '../../blogs/blogs.types';

const blogInputData: BlogInputModel = {
  name: 'Kamil',
  description:
    'A blog description or Meta description is a short piece of text',
  websiteUrl: 'https://yandex.com/',
};

const postsInputData = {
  title: 'Whiplash',
  shortDescription: 'a feature screenplay synopsis by Damien Chazelle',
  content:
    'A promising young drummer enrolls at a cut-throat music conservatory where his dreams of greatness are mentored by an instructor who will stop at nothing to realize a student’s potential.',
};

describe('PostController (e2e)', () => {
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
  describe('Posts router GET method', () => {
    it('should return 200 and empty array posts', async () => {
      await request(httpServer).get('/posts').expect(200, {
        pagesCount: 0,
        page: 1,
        pageSize: 10,
        totalCount: 0,
        items: [],
      });
    });
    it('should return 201 status and add new post', async () => {
      const { createdEntity } = await blogsTestManager.createBlog(
        httpServer,
        blogInputData,
      );
      await postsTestManager.createBlogAndPostForHim(
        httpServer,
        postsInputData,
        createdEntity.id,
        201,
      );
    });
    it('should get post by id', async () => {
      const { createdEntity } = await blogsTestManager.createBlog(
        httpServer,
        blogInputData,
      );
      const post = await postsTestManager.createBlogAndPostForHim(
        httpServer,
        postsInputData,
        createdEntity.id,
        201,
      );
      const getPostResponse = await request(httpServer).get(
        `/posts/${post.createdEntity.id}`,
      );
      expect(getPostResponse.status).toBe(200);
      const postFromAPi = getPostResponse.body;
      expect(postFromAPi).toEqual(post.createdEntity);
    });
    it('should get non-existent post and return 404', async () => {
      const randomNumber = '6348acd2e1a47ca32e79f46f';
      const getPostResponse = await request(httpServer).get(
        `/posts/${randomNumber}`,
      );
      expect(getPostResponse.status).toBe(404);
    });
  });
  describe('Posts router DELETE method', () => {
    beforeAll(async () => {
      await request(httpServer).delete('/testing/all-data');
    });
    it('should delete unexciting posts by id and return 404', async () => {
      const randomNumber = '6348acd2e1a47ca32e79f46f';
      await request(httpServer)
        .delete(`/posts/${randomNumber}`)
        .auth('admin', 'qwerty')
        .expect(404);
    });
    it('should delete  blog by id unauthorized and return 401 ', async () => {
      const randomNumber = '6348acd2e1a47ca32e79f46f';
      await request(httpServer).delete(`/posts/${randomNumber}`).expect(401);
    });
    it('should delete post by id', async () => {
      const { createdEntity } = await blogsTestManager.createBlog(
        httpServer,
        blogInputData,
      );
      const post = await postsTestManager.createBlogAndPostForHim(
        httpServer,
        postsInputData,
        createdEntity.id,
        201,
      );

      await request(httpServer)
        .delete('/posts/' + post.createdEntity.id)
        .auth('admin', 'qwerty')
        .expect(204);

      await request(httpServer).get('/posts').expect(200, {
        pagesCount: 0,
        page: 1,
        pageSize: 10,
        totalCount: 0,
        items: [],
      });
    });
  });
  describe('Posts router POST method', () => {
    // beforeAll(async () => {
    //     await request(httpServer).delete('/testing/all-data')
    // })
    it('try add post by unauthorized user and return 401', async () => {
      const response = await request(httpServer)
        .post('/blogs')
        .send(postsInputData);
      expect(response.status).toBe(401);
    });
    it('try add new blog with wrong data and get 400', async () => {
      const { createdEntity } = await blogsTestManager.createBlog(
        httpServer,
        blogInputData,
      );
      const postsInputData = {
        title: '',
        shortDescription: 'How to make money?',
        content: 'Just born in Billionare family',
      };
      const { response } = await postsTestManager.createBlogAndPostForHim(
        httpServer,
        postsInputData,
        createdEntity.id,
        400,
      );
      expect(response.status).toBe(400);
    });
  });
  describe('Posts router PUT method', () => {
    it('should delete all blogs', async () => {
      await request(httpServer).delete('/testing/all-data');
      await request(httpServer).get('/posts').expect(200, {
        pagesCount: 0,
        page: 1,
        pageSize: 10,
        totalCount: 0,
        items: [],
      });
    });
    it('should return 204 status and  change post', async () => {
      const { createdEntity } = await blogsTestManager.createBlog(
        httpServer,
        blogInputData,
      );
      const post = await postsTestManager.createBlogAndPostForHim(
        httpServer,
        postsInputData,
        createdEntity.id,
        201,
      );

      const resp = await request(httpServer)
        .put('/posts/' + post.createdEntity.id)
        .auth('admin', 'qwerty')
        .send({
          title: 'Women',
          shortDescription: 'How to sleep with 1000 women?',
          content: 'Just born in Billionare family',
          blogId: createdEntity.id,
        });
      expect(resp.status).toBe(204);
      const getUpdatePost = await request(httpServer).get(
        '/posts/' + post.createdEntity.id,
      );
      // const getUpdatePost = await postQueryRepository.findPostById(
      //   post.createdEntity.id,
      // );
      await request(httpServer)
        .get('/posts')
        .expect(200, {
          pagesCount: 1,
          page: 1,
          pageSize: 10,
          totalCount: 1,
          items: [getUpdatePost.body],
        });
    });
    it('try change post unauthorized and return 401', async () => {
      const { createdEntity } = await blogsTestManager.createBlog(
        httpServer,
        blogInputData,
      );
      const post = await postsTestManager.createBlogAndPostForHim(
        httpServer,
        postsInputData,
        createdEntity.id,
        201,
      );

      const resp = await request(httpServer)
        .put('/posts/' + post.createdEntity.id)
        .send({
          title: 'Sport',
          shortDescription: 'How to be Fit?',
          content: 'Just go to fu**cking gym and eat healthy men',
          blogId: '2',
          blogName: 'sport',
        });
      expect(resp.status).toBe(401);
    });
    it('should return 400 status and try change post by wrong data', async () => {
      const { createdEntity } = await blogsTestManager.createBlog(
        httpServer,
        blogInputData,
      );
      const post = await postsTestManager.createBlogAndPostForHim(
        httpServer,
        postsInputData,
        createdEntity.id,
        201,
      );
      const resp = await request(httpServer)
        .put('/posts/' + post.createdEntity.id)
        .send({
          title: 'Sport',
          shortDescription: '',
          content: 'Just go to fu**cking gym and eat healthy men',
          blogId: '2',
          blogName: 'sport',
        })
        .auth('admin', 'qwerty');
      expect(resp.status).toBe(400);
    });
    it('try change  non-exist blog and return 404', async () => {
      const randomNumber = 561649849;
      const resp = await request(httpServer)
        .put('/posts/' + randomNumber)
        .send({
          title: 'Sport',
          shortDescription: 'How to be fit?',
          content: 'Just go to fu**cking gym and eat healthy men',
          blogId: '252565',
          blogName: 'sport',
        })
        .auth('admin', 'qwerty');
      expect(resp.status).toBe(404);
    });
  });
});
