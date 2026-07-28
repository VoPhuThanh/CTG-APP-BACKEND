import type { MediaStorageConfig } from '@/configs/media-storage.config';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { constants } from 'node:fs';
import {
  access,
  link,
  mkdir,
  readFile,
  unlink,
  writeFile,
} from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import type {
  StorageProvider,
  StorageWriteRequest,
  StoredObject,
} from './storage-provider.interface';

@Injectable()
export class LocalStorageProvider implements StorageProvider, OnModuleInit {
  readonly name: string;

  constructor(private readonly config: MediaStorageConfig) {
    this.name = config.provider;
  }

  async onModuleInit(): Promise<void> {
    await mkdir(this.config.localDirectory, { recursive: true });
    await access(this.config.localDirectory, constants.W_OK);
  }

  async write(request: StorageWriteRequest): Promise<StoredObject> {
    const targetPath = this.resolveKey(request.key);
    const temporaryPath = `${targetPath}.${randomUUID()}.tmp`;

    await mkdir(dirname(targetPath), { recursive: true });

    try {
      await writeFile(temporaryPath, request.body, { flag: 'wx' });
      await link(temporaryPath, targetPath);
    } finally {
      await unlink(temporaryPath).catch(() => undefined);
    }

    return {
      key: request.key,
      provider: this.name,
      bucket: null,
    };
  }

  async delete(key: string): Promise<void> {
    const targetPath = this.resolveKey(key);

    try {
      await unlink(targetPath);
    } catch (error) {
      if (!this.isMissingFileError(error)) throw error;
    }
  }

  async read(key: string): Promise<Buffer> {
    return readFile(this.resolveKey(key));
  }

  async exists(key: string): Promise<boolean> {
    try {
      await access(this.resolveKey(key));
      return true;
    } catch (error) {
      if (this.isMissingFileError(error)) return false;
      throw error;
    }
  }

  private resolveKey(key: string): string {
    this.assertSafeKey(key);

    const targetPath = resolve(this.config.localDirectory, ...key.split('/'));
    const relativePath = relative(this.config.localDirectory, targetPath);

    if (
      relativePath.startsWith('..') ||
      isAbsolute(relativePath) ||
      relativePath === ''
    ) {
      throw new Error('Storage key resolves outside the configured directory.');
    }

    return targetPath;
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

  private isMissingFileError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'ENOENT'
    );
  }
}
