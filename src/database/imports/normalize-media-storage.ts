import { AppDataSource } from '../data-source';
import { MediaAsset } from '@/modules/media-assets/entities/media-asset.entity';
import { IsNull, type FindOptionsWhere } from 'typeorm';

interface NormalizeMediaStorageOptions {
  apply: boolean;
  fromProvider: string;
  fromBucket: string | null;
  toProvider: string;
  toBucket: string;
}

function readNamedArgument(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv
    .find((argument) => argument.startsWith(prefix))
    ?.slice(prefix.length);
}

export function parseNormalizeMediaStorageArguments(): NormalizeMediaStorageOptions {
  const fromProvider = readNamedArgument('from-provider')?.trim();
  const fromBucketValue = readNamedArgument('from-bucket')?.trim();
  const fromBucket =
    fromBucketValue?.toLowerCase() === 'null' ? null : fromBucketValue;
  const toProvider = readNamedArgument('to-provider')?.trim() || 's3';
  const toBucket = readNamedArgument('to-bucket')?.trim();

  if (!fromProvider) {
    throw new Error('--from-provider is required.');
  }
  if (fromBucket === undefined || fromBucket === '') {
    throw new Error('--from-bucket is required; use "null" for no bucket.');
  }
  if (!toProvider) {
    throw new Error('--to-provider must not be empty.');
  }
  if (!toBucket) {
    throw new Error('--to-bucket is required.');
  }

  return {
    apply: process.argv.includes('--apply'),
    fromProvider,
    fromBucket,
    toProvider,
    toBucket,
  };
}

export async function normalizeMediaStorage(): Promise<void> {
  const options = parseNormalizeMediaStorageArguments();
  await AppDataSource.initialize();

  try {
    const repository = AppDataSource.getRepository(MediaAsset);
    const where: FindOptionsWhere<MediaAsset> = {
      storageProvider: options.fromProvider,
      bucket: options.fromBucket === null ? IsNull() : options.fromBucket,
    };
    const matched = await repository.count({ where, withDeleted: true });

    console.log(
      JSON.stringify({
        mode: options.apply ? 'apply' : 'dry-run',
        matched,
        fromProvider: options.fromProvider,
        fromBucket: options.fromBucket,
        toProvider: options.toProvider,
        toBucket: options.toBucket,
      }),
    );

    if (!options.apply || matched === 0) return;

    const result = await AppDataSource.transaction((manager) =>
      manager.update(MediaAsset, where, {
        storageProvider: options.toProvider,
        bucket: options.toBucket,
      }),
    );

    console.log(
      JSON.stringify({
        mode: 'apply',
        updated: result.affected ?? 0,
      }),
    );
  } finally {
    await AppDataSource.destroy();
  }
}

if (require.main === module) {
  void normalizeMediaStorage().catch((error: unknown) => {
    const message =
      error instanceof Error ? error.message : 'Unknown normalization error.';
    console.error(`Media storage normalization failed: ${message}`);
    process.exitCode = 1;
  });
}
