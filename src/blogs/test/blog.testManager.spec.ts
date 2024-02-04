import { BlogInputModel } from '../blogs.types';
import { ResultCode } from '../../helpers/heplersType';
import request from 'supertest';

export const blogsTestManager = {
  async createBlog(
    server: string,
    data: BlogInputModel,
    expectedStatusCode: ResultCode = ResultCode.Created,
  ) {
    const blogData = {
      name: data.name,
      description: data.description,
      websiteUrl: data.websiteUrl,
      createdAt: new Date().toISOString(),
      isMembership: false,
    };
    const response = await request(server)
      .post('/blogs')
      .auth('admin', 'qwerty')
      .send(blogData)
      .expect(expectedStatusCode);

    let createdEntity;
    if (expectedStatusCode === ResultCode.Created) {
      createdEntity = response.body;
      expect(createdEntity).toEqual({
        id: expect.any(String),
        name: data.name,
        description: data.description,
        websiteUrl: data.websiteUrl,
        createdAt: expect.any(String),
        isMembership: expect.any(Boolean),
      });
    }
    return { response, createdEntity };
  },
};
