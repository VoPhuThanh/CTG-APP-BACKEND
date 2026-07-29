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
  readonly name: string;
  private readonly client: Client;
  private readonly bucket: string;

  constructor(private readonly config: MediaStorageConfig) {
    const remoteConfig = config.minio ?? config.s3;

    if (!remoteConfig) {
      throw new Error('Remote media storage configuration is unavailable.');
    }

    this.name = config.provider;
    this.bucket = remoteConfig.bucket;
    this.client = new Client({
      endPoint: config.s3?.endpointHost ?? config.minio?.endpoint ?? '',
      port: remoteConfig.port,
      useSSL: remoteConfig.useSsl,
      accessKey: remoteConfig.accessKey,
      secretKey: remoteConfig.secretKey,
      region: remoteConfig.region,
    });
  }

  async onModuleInit(): Promise<void> {
    const exists = await this.client.bucketExists(this.bucket);
    if (!exists) {
      throw new Error(
        `Configured media bucket "${this.bucket}" does not exist or is not accessible.`,
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

  async read(key: string): Promise<Buffer> {
    this.assertSafeKey(key);
    const stream = await this.client.getObject(this.bucket, key);
    const chunks: Buffer[] = [];

    for await (const chunk of stream as AsyncIterable<unknown>) {
      if (typeof chunk === 'string' || chunk instanceof Uint8Array) {
        chunks.push(Buffer.from(chunk));
      } else {
        throw new Error('Storage provider returned a non-buffer object chunk.');
      }
    }

    return Buffer.concat(chunks);
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
