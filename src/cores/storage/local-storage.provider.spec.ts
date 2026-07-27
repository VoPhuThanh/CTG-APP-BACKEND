import express from 'express';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import type { MediaStorageConfig } from '@/configs/media-storage.config';
import { LocalStorageProvider } from './local-storage.provider';

describe('LocalStorageProvider', () => {
  let rootDirectory: string;
  let config: MediaStorageConfig;
  let provider: LocalStorageProvider;

  beforeEach(async () => {
    rootDirectory = await mkdtemp(join(tmpdir(), 'ctg-media-storage-'));
    config = {
      provider: 'local',
      localDirectory: rootDirectory,
      publicPath: '/uploads/media',
      publicBaseUrl: null,
      cacheControl: 'public, max-age=31536000, immutable',
      minio: null,
      maxFileSizeBytes: 1024,
      allowedMimeTypes: new Set(['image/png']),
    };
    provider = new LocalStorageProvider(config);
    await provider.onModuleInit();
  });

  afterEach(async () => {
    await rm(rootDirectory, { recursive: true, force: true });
  });

  it('writes, finds, publicly serves, and deletes a managed object', async () => {
    const key = 'images/2026/07/test.png';
    const body = Buffer.from('stored-image');

    const stored = await provider.write({
      key,
      body,
      contentType: 'image/png',
    });

    await expect(provider.exists(key)).resolves.toBe(true);
    expect(stored).toEqual({
      key,
      provider: 'local',
      bucket: null,
    });

    const app = express();
    app.use(config.publicPath, express.static(rootDirectory));
    await request(app)
      .get(`${config.publicPath}/${stored.key}`)
      .expect(200, body);

    await provider.delete(key);
    await expect(provider.exists(key)).resolves.toBe(false);
    await expect(provider.delete(key)).resolves.toBeUndefined();
  });

  it.each([
    '../outside.png',
    '/absolute.png',
    'images/../../outside.png',
    'images\\outside.png',
    'images//outside.png',
  ])('rejects unsafe storage key %s', async (key) => {
    await expect(
      provider.write({ key, body: Buffer.from('x'), contentType: 'image/png' }),
    ).rejects.toThrow('Storage key');
  });

  it('does not overwrite an existing key', async () => {
    const key = 'images/2026/07/collision.png';
    await provider.write({
      key,
      body: Buffer.from('first'),
      contentType: 'image/png',
    });

    await expect(
      provider.write({
        key,
        body: Buffer.from('second'),
        contentType: 'image/png',
      }),
    ).rejects.toMatchObject({ code: 'EEXIST' });
  });
});
