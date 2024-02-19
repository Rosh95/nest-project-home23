import { MongooseModule, MongooseModuleAsyncOptions } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Module } from '@nestjs/common';

let mongod;

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: async () => {
        mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        return {
          uri,
          useNewUrlParser: true,
          useUnifiedTopology: true,
        };
      },
    } as MongooseModuleAsyncOptions),
  ],
})
export class DbMongooseTestingMemoryModule {}
