import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { DbMongooseModule } from '../src/modules/DbMongooseModule';
import { DbMongooseTestingMemoryModule } from '../src/modules/DbMongooseTestingMemoryModule';
import { UserRepository } from '../src/users/user.repository';
import { appSettings } from '../src/appSettings';

export function testInit() {
  let app: INestApplication;
  let httpServer;
  let UserModel;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideModule(DbMongooseModule)
      .useModule(DbMongooseTestingMemoryModule)
      .compile();

    app = moduleFixture.createNestApplication();
    appSettings(app);

    const userRepository = app.get<UserRepository>(UserRepository);
    UserModel = userRepository.userModel;

    await app.init();
    httpServer = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  return { UserModel, httpServer }; // тут можешь вернуть все что заинитил и использовать в тестах
}
