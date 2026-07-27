import type { MediaStorageConfig } from '@/configs/media-storage.config';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client } from 'minio';
import type {
  StorageProvider,
  StorageWriteRequest,
  StoredObject,
} from './storage-provider.interface';

@Injectable()
export class MinioStorageProvider implements StorageProvider, OnModuleInit {
  readonly name = 'minio';
  private readonly client: Client;
  private readonly bucket: string;

  constructor(private readonly config: MediaStorageConfig) {
    if (!config.minio) {
      throw new Error('MinIO storage configuration is unavailable.');
    }

    this.bucket = config.minio.bucket;
    this.client = new Client({
      endPoint: config.minio.endpoint,
      port: config.minio.port,
      useSSL: config.minio.useSsl,
      accessKey: config.minio.accessKey,
      secretKey: config.minio.secretKey,
      region: config.minio.region,
    });
  }

  async onModuleInit(): Promise<void> {
    const exists = await this.client.bucketExists(this.bucket);
    if (!exists) {
      throw new Error(
        `Configured MinIO bucket "${this.bucket}" does not exist. Run the bucket bootstrap before starting the backend.`,
      );
    }
  }

  async write(request: StorageWriteRequest): Promise<StoredObject> {
    this.assertSafeKey(request.key);
    await this.client.putObject(
      this.bucket,
      request.key,
      request.body,
      request.body.length,
      {
        'Content-Type': request.contentType,
        'Cache-Control': request.cacheControl ?? this.config.cacheControl,
      },
    );

    return {
      key: request.key,
      provider: this.name,
      bucket: this.bucket,
    };
  }

  async delete(key: string): Promise<void> {
    this.assertSafeKey(key);
    await this.client.removeObject(this.bucket, key);
  }

  async exists(key: string): Promise<boolean> {
    this.assertSafeKey(key);
    try {
      await this.client.statObject(this.bucket, key);
      return true;
    } catch (error) {
      if (this.isMissingObjectError(error)) return false;
      throw error;
    }
  }

  private isMissingObjectError(error: unknown): boolean {
    if (typeof error !== 'object' || error === null) return false;

    const code =
      'code' in error && typeof error.code === 'string' ? error.code : null;
    return code === 'NoSuchKey' || code === 'NotFound';
  }

  private assertSafeKey(key: string): void {
    const segments = key.split('/');
    if (
      !key ||
      key.startsWith('/') ||
      key.includes('\\') ||
      key.includes('\0') ||
      segments.some(
        (segment) => !segment || segment === '.' || segment === '..',
      )
    ) {
      throw new Error('Storage key must be a safe relative POSIX path.');
    }
  }
}
