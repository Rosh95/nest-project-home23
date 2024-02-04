import { ResultCode } from '../../helpers/heplersType';
import request from 'supertest';
import { postInputDataModelForExistingBlog } from '../post.types';

export const postsTestManager = {
  async createBlogAndPostForHim(
    server,
    data: postInputDataModelForExistingBlog,
    blogId: string,
    expectedStatusCode: ResultCode = ResultCode.Created,
  ) {
    const dataPost = {
      title: data.title,
      shortDescription: data.shortDescription,
      content: data.content,
      blogId: blogId,
    };
    const response = await request(server)
      .post('/posts')
      .auth('admin', 'qwerty')
      .send(dataPost)
      .expect(expectedStatusCode);
    let createdEntity;

    if (expectedStatusCode === ResultCode.Created) {
      createdEntity = response.body;
      expect(createdEntity).toEqual({
        id: expect.any(String),
        title: dataPost.title,
        shortDescription: dataPost.shortDescription,
        content: dataPost.content,
        blogId: blogId,
        blogName: createdEntity.blogName,
        createdAt: expect.any(String),
        extendedLikesInfo: {
          dislikesCount: 0,
          likesCount: 0,
          myStatus: 'None',
          newestLikes: [],
        },
      });
    }
    return { response, createdEntity };
  },
};
