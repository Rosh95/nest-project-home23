import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { settings } from '../settings';

@Module({
  imports: [MongooseModule.forRoot(settings().MONGO_URL)],
})
export class DbMongooseModule {}
