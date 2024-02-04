import {
  BadRequestException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { HttpExceptionFilter } from './exceptionFilter';
import cookieParser from 'cookie-parser';
import { useContainer } from 'class-validator';
import { AppModule } from './app.module';

export const appSettings = (app: INestApplication) => {
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      stopAtFirstError: true,
      exceptionFactory: (errorsMessages) => {
        const errorsForResponse: any = [];

        errorsMessages.forEach((e) => {
          const constraintsKeys = Object.keys(e.constraints!);
          constraintsKeys.forEach((ckey) => {
            errorsForResponse.push({
              message: e.constraints![ckey],
              field: e.property,
            });
          });
        });

        throw new BadRequestException(errorsForResponse);
      },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.use(cookieParser());
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
};
