import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

// export enum HttpStatusCode {
//   OK = 200,
//   CREATED = 201,
//   ACCEPTED = 202,
//   NON_AUTHORITATIVE_INFORMATION = 203,
//   NO_CONTENT = 204,
//   BAD_REQUEST = 400,
//   UNAUTHORIZED = 401,
//   PAYMENT_REQUIRED = 402,
//   FORBIDDEN = 403,
//   NOT_FOUND = 404,
//   INTERNAL_SERVER_ERROR = 500,
//   BAD_GATEWAY = 502,
// }

export enum ResultCode {
  Success = 200,
  Created = 201,
  NoContent = 204,
  Unauthorized = 401,
  BadRequest = 400,
  Forbidden = 403,
  NotFound = 404,
  ServerError = 500,
  BadGetway = 502,
}

export type ResultObject<T> = {
  data: T | null;
  resultCode: ResultCode;
  message?: string;
};
// change on class
// export class ResultObject2<T> {
//   data: T | null;
//   resultCode: ResultCode;
//   message?: string;
//   constructor() {}
// }
export const mappingErrorStatus = (resultObject: ResultObject<any>) => {
  const statusCode = resultObject.resultCode;
  const textError = resultObject.message || 'no message';
  switch (statusCode) {
    case ResultCode.BadRequest:
      throw new BadRequestException({
        message: [{ message: textError, status: statusCode }],
      });
    case ResultCode.Unauthorized:
      throw new UnauthorizedException({
        message: [{ message: textError, status: statusCode }],
      });
    case ResultCode.Forbidden:
      throw new ForbiddenException({
        message: [{ message: textError, status: statusCode }],
      });
    case ResultCode.NotFound:
      throw new NotFoundException({
        message: [{ message: textError, status: statusCode }],
      });
    case ResultCode.ServerError:
      throw new InternalServerErrorException({
        message: [{ message: textError, status: statusCode }],
      });
    default:
      return 418;
  }
};
