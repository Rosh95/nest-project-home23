import { Response, Request } from 'express';
import { Injectable, Post, Req, Res } from '@nestjs/common';

@Injectable()
export class EmailController {
  constructor() {}
  @Post()
  async sendEmail(@Req() req: Request, @Res() res: Response) {
    res.send({
      email: req.body.email,
      message: req.body.message,
      subject: req.body.subject,
    });
  }
}
