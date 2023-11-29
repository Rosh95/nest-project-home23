import { Controller, Delete, Injectable } from '@nestjs/common';
import { TestingService } from './testing.service';

// export const testRouter = Router({});
//
// testRouter.delete('/', async (req: Request, res: Response) => {
//   await BlogModel.deleteMany({});
//   await PostModel.deleteMany({});
//   await UserModel.deleteMany({});
//   await CommentModel.deleteMany({});
//   await DeviceModel.deleteMany({});
//   await LoginAttemptModel.deleteMany({});
//   res.sendStatus(204);
// });

@Injectable()
@Controller('testing')
export class TestingController {
  constructor(public testingService: TestingService) {}
  @Delete('all-data')
  async deleteAll() {
    await this.testingService.deletingAll();

    return true;
  }
}
