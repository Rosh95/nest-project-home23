import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './exceptionFilter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      stopAtFirstError: true,
      // exceptionFactory: (errors) => {
      //   throw new BadRequestException([]);
      // },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(3001);
}
bootstrap().then();
