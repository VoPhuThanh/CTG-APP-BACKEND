import {
  DEFAULT_MEDIA_PUBLIC_PATH,
  type MediaStorageConfig,
} from '@/configs/media-storage.config';
import { ConfigService } from '@nestjs/config';
import type { MediaAsset } from './entities/media-asset.entity';
import { getMediaStorageConfig } from '@/configs/media-storage.config';

function encodeStorageKey(storageKey: string): string {
  return storageKey
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

export function resolveMediaAssetPublicUrl(
  asset: Pick<MediaAsset, 'url' | 'storageProvider' | 'storageKey' | 'bucket'>,
  config: MediaStorageConfig = getMediaStorageConfig(
    new ConfigService(process.env),
  ),
): string {
  if (!asset.storageProvider || !asset.storageKey) {
    if (!asset.url) {
      throw new Error('External media asset is missing its compatibility URL.');
    }

    return asset.url;
  }

  const encodedKey = encodeStorageKey(asset.storageKey);

  if (asset.storageProvider === 'minio') {
    if (!config.publicBaseUrl) {
      throw new Error(
        'MEDIA_PUBLIC_BASE_URL is required to resolve managed MinIO assets.',
      );
    }
    if (!asset.bucket || asset.bucket !== config.minio?.bucket) {
      throw new Error(
        'MinIO media asset bucket does not match the configured deployment bucket.',
      );
    }

    return `${config.publicBaseUrl}/${encodedKey}`;
  }

  if (asset.storageProvider === 'local') {
    const publicPath = config.publicPath || DEFAULT_MEDIA_PUBLIC_PATH;
    const relativeUrl = `${publicPath}/${encodedKey}`;
    return config.publicBaseUrl
      ? `${config.publicBaseUrl}${relativeUrl}`
      : relativeUrl;
  }

  if (asset.url) return asset.url;

  throw new Error(
    `Media asset provider "${asset.storageProvider}" cannot be resolved by this deployment.`,
  );
}
