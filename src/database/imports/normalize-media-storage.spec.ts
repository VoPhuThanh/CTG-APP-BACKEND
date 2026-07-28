import { parseNormalizeLegacyMediaUrlArguments } from './normalize-legacy-media-urls';
import { parseNormalizeMediaStorageArguments } from './normalize-media-storage';

describe('media normalization command arguments', () => {
  const originalArgv = process.argv;

  afterEach(() => {
    process.argv = originalArgv;
  });

  it('keeps storage metadata normalization in dry-run mode by default', () => {
    process.argv = [
      'node',
      'normalize-media-storage.js',
      '--from-provider=minio',
      '--from-bucket=ctg-media',
      '--to-provider=s3',
      '--to-bucket=ctg-media',
    ];

    expect(parseNormalizeMediaStorageArguments()).toEqual({
      apply: false,
      fromProvider: 'minio',
      fromBucket: 'ctg-media',
      toProvider: 's3',
      toBucket: 'ctg-media',
    });
  });

  it('supports exact null-bucket matching only when explicitly requested', () => {
    process.argv = [
      'node',
      'normalize-media-storage.js',
      '--apply',
      '--from-provider=local',
      '--from-bucket=null',
      '--to-bucket=ctg-media',
    ];

    expect(parseNormalizeMediaStorageArguments()).toEqual(
      expect.objectContaining({
        apply: true,
        fromBucket: null,
        toProvider: 's3',
      }),
    );
  });

  it('keeps legacy URL normalization in dry-run mode by default', () => {
    process.argv = [
      'node',
      'normalize-legacy-media-urls.js',
      '--from-base=http://localhost:9000/ctg-media/',
      '--to-base=https://media.example.com/',
    ];

    expect(parseNormalizeLegacyMediaUrlArguments()).toEqual({
      apply: false,
      fromBase: 'http://localhost:9000/ctg-media',
      toBase: 'https://media.example.com',
    });
  });

  it('requires exact source and destination arguments', () => {
    process.argv = ['node', 'normalize-legacy-media-urls.js'];

    expect(() => parseNormalizeLegacyMediaUrlArguments()).toThrow(
      '--from-base',
    );
  });
});
