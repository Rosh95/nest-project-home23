import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../app.module';
import { appSettings } from '../../appSettings';
import { blogsTestManager } from './blog.testManager.spec';
import { BlogInputModel } from '../blogs.types';
import { postsTestManager } from '../../posts/test/post.testManager.spec';

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

const postsInputData = {
  title: 'Whiplash',
  shortDescription: 'a feature screenplay synopsis by Damien Chazelle',
  content:
    'A promising young drummer enrolls at a cut-throat music conservatory where his dreams of greatness are mentored by an instructor who will stop at nothing to realize a student’s potential.',
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

    await request(httpServer).delete('/testing/all-data');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Blogs router GET method', () => {
    beforeAll(async () => {
      await request(httpServer).delete('/testing/all-data');
    });
    it('should return 200 and empty array blogs', async () => {
      await request(httpServer).get('/blogs').expect(200, {
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
      const getBlogResponse = await request(httpServer).get(
        `/blogs/${result.createdEntity.id}`,
      );
      expect(getBlogResponse.status).toBe(200);
      const blogFromAPi = getBlogResponse.body;
      expect(blogFromAPi).toEqual(result.response.body);
    });
    it('should get non-existent blog and return 404', async () => {
      const randomNumber = '6348acd2e1a47ca32e79f46f';
      const getBlogResponse = await request(httpServer).get(
        `/blogs/${randomNumber}`,
      );
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
        `/blogs/${randomNumber}/posts`,
      );
      expect(getWrongBlogResponse.status).toBe(404);

      const getBlogResponse = await request(httpServer).get(
        `/blogs/${result.createdEntity.id}/posts`,
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
  });

  describe('Blogs router DELETE method', () => {
    beforeAll(async () => {
      await request(httpServer).delete('/testing/all-data');
    });
    it('should delete unexciting blog by id and return 404', async () => {
      const randomNumber = '6348acd2e1a47ca32e79f46f';
      await request(httpServer)
        .delete(`/blogs/${randomNumber}`)
        .auth('admin', 'qwerty')
        .expect(404);
    });
    it('should delete  blog by id unauthorized and return 401 ', async () => {
      const randomNumber = '6348acd2e1a47ca32e79f46f';
      await request(httpServer).delete(`/blogs/${randomNumber}`).expect(401);
    });
    it('should delete blog by id', async () => {
      const result = await blogsTestManager.createBlog(
        httpServer,
        blogInputData,
      );
      await request(httpServer)
        .delete('/blogs/' + result.createdEntity.id)
        .auth('admin', 'qwerty')
        .expect(204);

      await request(httpServer).get('/blogs').expect(200, {
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
      await request(httpServer).post('/blogs').send(blogInputData).expect(401);
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
        .post(`/blogs/${result.createdEntity.id}/posts`)
        .send(dataPost)
        .expect(401);
      await request(httpServer)
        .post(`/blogs/${randomNumber}/posts`)
        .auth('admin', 'qwerty')
        .send(dataPost)
        .expect(404);

      const resp = await request(httpServer)
        .post(`/blogs/${result.createdEntity.id}/posts`)
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
        .put('/blogs/' + result.createdEntity.id)
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
        .get('/blogs')
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
        .put('/blogs/' + result.createdEntity.id)
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
        .put('/blogs/' + result.createdEntity.id)
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
        .put(`/blogs/${randomNumber}`)
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
