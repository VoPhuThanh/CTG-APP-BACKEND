import { HttpException } from '@nestjs/common';

interface ErrorOptions {
  message?: string;
  status?: number;
  code?: string;
  seq?: string;
  params?: Record<string, any>;
}

export class HandleError extends HttpException {
  private readonly code: string;
  private readonly params: Record<string, any>;
  private readonly seq: string;

  constructor(options: ErrorOptions);
  constructor(message: string, status?: number);
  constructor(message: string, status: number, code: string);
  constructor(
    message: string,
    status: number,
    code: string,
    params: Record<string, any>,
  );
  constructor(
    messageOrOptions: string | ErrorOptions,
    status?: number,
    code?: string,
    params?: Record<string, any>,
  ) {
    if (typeof messageOrOptions === 'object') {
      // Xử lý khi truyền vào options object
      const options = messageOrOptions;
      super(options.message || 'Error', options.status || 400);
      this.code = options.code || `${options.status || 400}`;
      this.params = options.params || { s1: options.message || 'Error' };
      this.seq = options.seq || '';
    } else {
      // Xử lý khi truyền vào các tham số riêng lẻ
      const message = messageOrOptions;
      super(message, status || 400);
      this.code = code || `${status || 400}`;
      this.params = params || { s1: message || 'Error' };
      this.seq = '';
    }
  }

  getCode(): string {
    return this.code;
  }

  getParams(): Record<string, any> {
    return this.params;
  }

  getSeq(): string {
    return this.seq;
  }

  // Thêm các helper methods
  static badRequest(options: ErrorOptions): HandleError {
    return new HandleError({ status: 400, ...options });
  }

  static unauthorized(options: ErrorOptions): HandleError {
    return new HandleError({ status: 401, ...options });
  }

  static forbidden(options: ErrorOptions): HandleError {
    return new HandleError({ status: 403, ...options });
  }

  static notFound(options: ErrorOptions): HandleError {
    return new HandleError({ status: 404, ...options });
  }

  static conflict(options: ErrorOptions): HandleError {
    return new HandleError({ status: 409, ...options });
  }

  static validation(options: ErrorOptions): HandleError {
    return new HandleError({ status: 422, ...options });
  }

  static internal(options: ErrorOptions): HandleError {
    return new HandleError({ status: 500, ...options });
  }
  static tooManyRequests(options: ErrorOptions): HandleError {
    return new HandleError({ status: 429, ...options });
  }
}
