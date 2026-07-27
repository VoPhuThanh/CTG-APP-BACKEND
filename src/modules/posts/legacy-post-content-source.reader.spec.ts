import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { LegacyPostContentSourceReader } from './legacy-post-content-source.reader';

describe('LegacyPostContentSourceReader', () => {
  const temporaryDirectories: string[] = [];

  afterEach(async () => {
    await Promise.all(
      temporaryDirectories
        .splice(0)
        .map((directory) => rm(directory, { force: true, recursive: true })),
    );
  });

  it('reads a known local fragment below the explicitly configured root', async () => {
    const sourceRoot = await mkdtemp(join(tmpdir(), 'ctg-post-content-'));
    temporaryDirectories.push(sourceRoot);
    const contentDirectory = join(sourceRoot, 'content', 'posts');
    await mkdir(contentDirectory, { recursive: true });
    await writeFile(
      join(contentDirectory, 'guide.en.html'),
      '<h2>Guide</h2>',
      'utf8',
    );
    const reader = new LegacyPostContentSourceReader();

    await expect(
      reader.read('/content/posts/guide.en.html', {
        sourceRoot,
        maxBytes: 1024,
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        html: '<h2>Guide</h2>',
        byteLength: 14,
      }),
    );
  });

  it.each([
    ['../secret.html', 'invalid_relative_path'],
    ['/content/posts/%2e%2e/secret.html', 'invalid_relative_path'],
    ['/content/posts/guide.html?draft=true', 'unsupported_source'],
    ['C:/secret.html', 'unsupported_source'],
  ])('rejects unsafe local source %s', async (source, code) => {
    const sourceRoot = await mkdtemp(join(tmpdir(), 'ctg-post-content-'));
    temporaryDirectories.push(sourceRoot);
    const reader = new LegacyPostContentSourceReader();

    await expect(
      reader.read(source, { sourceRoot, maxBytes: 1024 }),
    ).rejects.toMatchObject({ code });
  });

  it('rejects remote sources instead of creating an HTML-fetch SSRF surface', async () => {
    const sourceRoot = await mkdtemp(join(tmpdir(), 'ctg-post-content-'));
    temporaryDirectories.push(sourceRoot);
    const reader = new LegacyPostContentSourceReader();

    await expect(
      reader.read('https://example.com/post.html', {
        sourceRoot,
        maxBytes: 1024,
      }),
    ).rejects.toMatchObject({ code: 'remote_source_not_supported' });
  });

  it('enforces the configured byte limit', async () => {
    const sourceRoot = await mkdtemp(join(tmpdir(), 'ctg-post-content-'));
    temporaryDirectories.push(sourceRoot);
    await writeFile(join(sourceRoot, 'large.html'), '12345', 'utf8');
    const reader = new LegacyPostContentSourceReader();

    await expect(
      reader.read('/large.html', { sourceRoot, maxBytes: 4 }),
    ).rejects.toMatchObject({ code: 'source_too_large' });
  });
});
