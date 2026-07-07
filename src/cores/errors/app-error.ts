import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AppErrorCode } from './app-error-code';
import { AppErrorMessage } from './app-error-message';

function buildErrorBody(statusCode: number, code: AppErrorCode) {
  return {
    statusCode,
    code,
    message: AppErrorMessage[code],
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

  conflict(code: AppErrorCode) {
    return new ConflictException(buildErrorBody(409, code));
  },
};
