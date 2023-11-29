import { Injectable } from '@nestjs/common';
import { TestingRepository } from './testing.repository';

@Injectable()
export class TestingService {
  constructor(public testingRepository: TestingRepository) {}

  async deletingAll() {
    await this.testingRepository.deleteAll();
    return;
  }
}
