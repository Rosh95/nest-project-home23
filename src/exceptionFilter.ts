import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';

// @Catch(Error)
// export class ErrorExceptionFilter implements ExceptionFilter {
//   catch(exception: HttpException, host: ArgumentsHost) {
//     const ctx = host.switchToHttp();
//     const response = ctx.getResponse<Response>();
//     // const request = ctx.getRequest<Request>();
//     const status = exception.getStatus();
//     console.log(status);
//
//     if (process.env.envoriment !== 'production') {
//       response
//         .status(500)
//         .send({ error: exception.toString(), stack: exception.stack });
//     } else {
//       response.status(500).send('some error ocurred');
//     }
//   }
// }

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;

    if (status === 500) {
      if (process.env.envoriment !== 'production') {
        response
          .status(500)
          .send({ error: exception.toString(), stack: exception.stack });
      } else {
        response.status(500).send('some error ocurred');
      }
    }

    if (status === 400) {
      const errorResponse: any = {
        errorsMessages: [],
      };

      const responseBody: any = exception.getResponse();

      responseBody.message.forEach((m) => errorResponse.errorsMessages.push(m));
      response.status(status).json(errorResponse);
    } else {
      response.status(status).json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }
  }
}
