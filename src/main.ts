import { NestFactory } from '@nestjs/core';
import { appSettings } from './appSettings';

import { AppModule } from './app.module';
import { settings } from './settings';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  appSettings(app);
  await app.listen(settings().PORT || 3000);
}
bootstrap().then();
