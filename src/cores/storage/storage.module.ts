import {
  getMediaStorageConfig,
  type MediaStorageConfig,
} from '@/configs/media-storage.config';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LocalStorageProvider } from './local-storage.provider';
import { MinioStorageProvider } from './minio-storage.provider';
import { STORAGE_PROVIDER } from './storage-provider.interface';

export const MEDIA_STORAGE_CONFIG = Symbol('MEDIA_STORAGE_CONFIG');

@Global()
@Module({
  providers: [
    {
      provide: MEDIA_STORAGE_CONFIG,
      inject: [ConfigService],
      useFactory: getMediaStorageConfig,
    },
    {
      provide: STORAGE_PROVIDER,
      inject: [MEDIA_STORAGE_CONFIG],
      useFactory: (config: MediaStorageConfig) => {
        if (config.provider === 'minio') {
          return new MinioStorageProvider(config);
        }

        return new LocalStorageProvider(config);
      },
    },
  ],
  exports: [MEDIA_STORAGE_CONFIG, STORAGE_PROVIDER],
})
export class StorageModule {}
