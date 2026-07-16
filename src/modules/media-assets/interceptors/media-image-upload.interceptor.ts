import { type MediaStorageConfig } from '@/configs/media-storage.config';
import { AppError } from '@/cores/errors/app-error';
import { AppErrorCode } from '@/cores/errors/app-error-code';
import { MEDIA_STORAGE_CONFIG } from '@/cores/storage/storage.module';
import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
  PayloadTooLargeException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class MediaImageUploadInterceptor implements NestInterceptor {
  private readonly fileInterceptor: NestInterceptor;

  constructor(@Inject(MEDIA_STORAGE_CONFIG) storageConfig: MediaStorageConfig) {
    const Interceptor = FileInterceptor('file', {
      limits: {
        fileSize: storageConfig.maxFileSizeBytes,
        files: 1,
      },
    });

    this.fileInterceptor = new Interceptor();
  }

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    let upload: Observable<unknown>;
    try {
      upload = await this.fileInterceptor.intercept(context, next);
    } catch (error) {
      this.rethrowUploadError(error);
    }

    return upload.pipe(
      catchError((error: unknown) => {
        this.rethrowUploadError(error);
      }),
    );
  }

  private rethrowUploadError(error: unknown): never {
    if (error instanceof PayloadTooLargeException) {
      throw AppError.payloadTooLarge(AppErrorCode.MEDIA_ASSET_FILE_TOO_LARGE);
    }

    throw error;
  }
}
