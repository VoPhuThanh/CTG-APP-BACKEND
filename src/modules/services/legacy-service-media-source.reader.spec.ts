import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  isPublicNetworkAddress,
  LegacyServiceMediaSourceReader,
} from './legacy-service-media-source.reader';

describe('LegacyServiceMediaSourceReader', () => {
  const temporaryDirectories: string[] = [];
  const options = {
    timeoutMs: 1_000,
    maxBytes: 1_024,
    maxRedirects: 1,
  };

  afterEach(async () => {
    await Promise.all(
      temporaryDirectories
        .splice(0)
        .map((directory) => rm(directory, { force: true, recursive: true })),
    );
  });

  it('requires an explicit source directory for frontend-relative paths', async () => {
    const reader = new LegacyServiceMediaSourceReader();

    await expect(
      reader.read('/images/services/card.png', options),
    ).rejects.toMatchObject({ code: 'source_directory_required' });
  });

  it('reads actual bytes below an explicit source directory and rejects traversal', async () => {
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64',
    );
    const sourceDirectory = await mkdtemp(
      join(tmpdir(), 'ctg-service-media-import-'),
    );
    temporaryDirectories.push(sourceDirectory);
    await writeFile(join(sourceDirectory, 'card.png'), png);
    const reader = new LegacyServiceMediaSourceReader();

    await expect(
      reader.read('/card.png', { ...options, sourceDirectory }),
    ).resolves.toEqual({
      buffer: png,
      originalFilename: 'card.png',
      declaredMimeType: null,
      sourceKind: 'source_directory',
    });
    await expect(
      reader.read('../card.png', { ...options, sourceDirectory }),
    ).rejects.toMatchObject({ code: 'invalid_relative_path' });
  });

  it.each([
    '127.0.0.1',
    '10.0.0.1',
    '100.64.0.1',
    '169.254.169.254',
    '172.16.0.1',
    '192.168.1.1',
    '::1',
    'fc00::1',
    'fe80::1',
    '2001:db8::1',
  ])('rejects non-public SSRF target %s', (address) => {
    expect(isPublicNetworkAddress(address)).toBe(false);
  });

  it.each(['8.8.8.8', '1.1.1.1', '2606:4700:4700::1111'])(
    'accepts globally routable address %s',
    (address) => {
      expect(isPublicNetworkAddress(address)).toBe(true);
    },
  );
});
