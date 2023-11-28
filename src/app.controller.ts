import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { CatsRepository } from './cats/cats.repository';
import { Cat } from './cats/cats-shema';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly catService: CatsRepository,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  @Get('cats')
  getAllCats(): Promise<Cat[]> {
    return this.catService.findAll();
  }
  @Post('cats')
  createCats(@Body() dto): Promise<Cat> {
    return this.catService.create(dto);
  }
}
