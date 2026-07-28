import {
  DEFAULT_MEDIA_PUBLIC_PATH,
  isLocalNetworkHostname,
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

function assertProductionSafeExternalUrl(url: string): void {
  if (process.env.NODE_ENV !== 'production') return;

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error('External media asset URL is invalid.');
  }

  if (
    parsedUrl.protocol !== 'https:' ||
    isLocalNetworkHostname(parsedUrl.hostname)
  ) {
    throw new Error(
      'External media asset URL is not safe for production delivery.',
    );
  }
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

    assertProductionSafeExternalUrl(asset.url);
    return asset.url;
  }

  const encodedKey = encodeStorageKey(asset.storageKey);

  if (asset.storageProvider === 'minio' || asset.storageProvider === 's3') {
    if (!config.publicBaseUrl) {
      throw new Error(
        'MEDIA_PUBLIC_BASE_URL is required to resolve managed remote assets.',
      );
    }
    if (!asset.bucket || asset.bucket !== config.bucket) {
      throw new Error(
        'Media asset bucket does not match the configured deployment bucket.',
      );
    }

    return `${config.publicBaseUrl}/${encodedKey}`;
  }

  if (asset.storageProvider === 'local') {
    if (config.provider !== 'local') {
      throw new Error(
        'Local media asset metadata must be normalized before remote deployment.',
      );
    }

    const publicPath = config.publicPath || DEFAULT_MEDIA_PUBLIC_PATH;
    const relativeUrl = `${publicPath}/${encodedKey}`;
    return config.publicBaseUrl
      ? `${config.publicBaseUrl}${relativeUrl}`
      : relativeUrl;
  }

  if (asset.url) {
    assertProductionSafeExternalUrl(asset.url);
    return asset.url;
  }

  throw new Error(
    `Media asset provider "${asset.storageProvider}" cannot be resolved by this deployment.`,
  );
}
