export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NON_AUTHORITATIVE_INFORMATION = 203,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  PAYMENT_REQUIRED = 402,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
}

export enum ResultCode {
  Success = 0,
  NotFound,
  BadRequest,
  Forbidden,
  DeviceNotFound,
  ServerError,
  NoContent,
}

export type ResultObject<T> = {
  data: T | null;
  resultCode: ResultCode;
  errorMessage?: string;
};
