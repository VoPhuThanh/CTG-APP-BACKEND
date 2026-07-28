import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  PayloadTooLargeException,
  InternalServerErrorException,
  UnauthorizedException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { AppErrorCode } from './app-error-code';
import { AppErrorMessage } from './app-error-message';

function buildErrorBody(
  statusCode: number,
  code: AppErrorCode,
  details?: unknown,
) {
  return {
    statusCode,
    code,
    message: AppErrorMessage[code],
    ...(details === undefined ? {} : { details }),
  };
}

export const AppError = {
  unauthorized(code: AppErrorCode) {
    return new UnauthorizedException(buildErrorBody(401, code));
  },

  badRequest(code: AppErrorCode) {
    return new BadRequestException(buildErrorBody(400, code));
  },

  notFound(code: AppErrorCode) {
    return new NotFoundException(buildErrorBody(404, code));
  },

  conflict(code: AppErrorCode, details?: unknown) {
    return new ConflictException(buildErrorBody(409, code, details));
  },

  payloadTooLarge(code: AppErrorCode) {
    return new PayloadTooLargeException(buildErrorBody(413, code));
  },

  unsupportedMediaType(code: AppErrorCode) {
    return new UnsupportedMediaTypeException(buildErrorBody(415, code));
  },

  internalServerError(code: AppErrorCode) {
    return new InternalServerErrorException(buildErrorBody(500, code));
  },
};
