import { AppError } from '@/cores/errors/app-error';
import { AppErrorCode } from '@/cores/errors/app-error-code';
import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

import {
  type AppliedCropMetadata,
  type CropMediaAssetDto,
} from './dtos/crop-media-asset.dto';

export interface ProcessedCrop {
  buffer: Buffer;
  mimeType: 'image/webp';
  width: number;
  height: number;
  fileSizeBytes: number;
  checksum: string;
  cropMetadata: AppliedCropMetadata;
  normalizedOriginalWidth: number;
  normalizedOriginalHeight: number;
}

export interface NormalizedImageDimensions {
  width: number;
  height: number;
}

const CROPPABLE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

@Injectable()
export class MediaImageProcessor {
  async getNormalizedDimensions(
    original: Buffer,
    originalMimeType: string,
  ): Promise<NormalizedImageDimensions> {
    if (!CROPPABLE_MIME_TYPES.has(originalMimeType)) {
      const metadata = await sharp(original, { animated: true }).metadata();
      if (!metadata.width || !metadata.height) {
        throw AppError.internalServerError(
          AppErrorCode.MEDIA_ASSET_IMAGE_PROCESSING_FAILED,
        );
      }
      return { width: metadata.width, height: metadata.height };
    }

    try {
      const metadata = await sharp(original, { failOn: 'error' }).metadata();
      const normalized = metadata.autoOrient;
      const width = normalized?.width ?? metadata.width;
      const height = normalized?.height ?? metadata.height;
      if (!width || !height) throw new Error('Missing image dimensions.');
      return { width, height };
    } catch {
      throw AppError.internalServerError(
        AppErrorCode.MEDIA_ASSET_IMAGE_PROCESSING_FAILED,
      );
    }
  }

  async crop(
    original: Buffer,
    originalMimeType: string,
    instructions: CropMediaAssetDto,
  ): Promise<ProcessedCrop> {
    if (!CROPPABLE_MIME_TYPES.has(originalMimeType)) {
      throw AppError.unsupportedMediaType(
        AppErrorCode.MEDIA_ASSET_CROP_UNSUPPORTED_IMAGE_TYPE,
      );
    }

    const rotation = instructions.rotation ?? 0;
    const quality = instructions.quality ?? 85;
    const cropMetadata: AppliedCropMetadata = {
      x: instructions.x,
      y: instructions.y,
      width: instructions.width,
      height: instructions.height,
      rotation,
      aspectRatio: instructions.aspectRatio ?? null,
      outputFormat: 'webp',
      quality,
    };

    this.assertCropValues(cropMetadata);

    try {
      const sourceMetadata = await sharp(original, {
        animated: true,
        failOn: 'error',
      }).metadata();
      if ((sourceMetadata.pages ?? 1) > 1) {
        throw AppError.unsupportedMediaType(
          AppErrorCode.MEDIA_ASSET_CROP_UNSUPPORTED_IMAGE_TYPE,
        );
      }

      const normalized = await sharp(original, { failOn: 'error' })
        .autoOrient()
        .toBuffer({ resolveWithObject: true });
      const normalizedWidth = normalized.info.width;
      const normalizedHeight = normalized.info.height;
      const rotated =
        rotation === 0
          ? normalized
          : await sharp(normalized.data)
              .rotate(rotation)
              .toBuffer({ resolveWithObject: true });

      if (
        cropMetadata.x + cropMetadata.width > rotated.info.width ||
        cropMetadata.y + cropMetadata.height > rotated.info.height
      ) {
        throw AppError.badRequest(AppErrorCode.MEDIA_ASSET_CROP_OUT_OF_BOUNDS);
      }

      const rendition = await sharp(rotated.data)
        .extract({
          left: cropMetadata.x,
          top: cropMetadata.y,
          width: cropMetadata.width,
          height: cropMetadata.height,
        })
        .webp({ quality })
        .toBuffer({ resolveWithObject: true });

      return {
        buffer: rendition.data,
        mimeType: 'image/webp',
        width: rendition.info.width,
        height: rendition.info.height,
        fileSizeBytes: rendition.data.length,
        checksum: this.checksum(rendition.data),
        cropMetadata,
        normalizedOriginalWidth: normalizedWidth,
        normalizedOriginalHeight: normalizedHeight,
      };
    } catch (error) {
      if (this.isHttpException(error)) {
        throw error;
      }

      throw AppError.internalServerError(
        AppErrorCode.MEDIA_ASSET_IMAGE_PROCESSING_FAILED,
      );
    }
  }

  private assertCropValues(crop: AppliedCropMetadata): void {
    if (
      !Number.isSafeInteger(crop.x) ||
      !Number.isSafeInteger(crop.y) ||
      !Number.isSafeInteger(crop.width) ||
      !Number.isSafeInteger(crop.height) ||
      crop.x < 0 ||
      crop.y < 0 ||
      crop.width <= 0 ||
      crop.height <= 0 ||
      ![0, 90, 180, 270].includes(crop.rotation) ||
      !Number.isSafeInteger(crop.quality) ||
      crop.quality < 1 ||
      crop.quality > 100 ||
      (crop.aspectRatio !== null &&
        (!Number.isFinite(crop.aspectRatio) || crop.aspectRatio <= 0))
    ) {
      throw AppError.badRequest(
        AppErrorCode.MEDIA_ASSET_INVALID_CROP_RECTANGLE,
      );
    }
  }

  private checksum(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  private isHttpException(error: unknown): boolean {
    return (
      error !== null &&
      typeof error === 'object' &&
      typeof Reflect.get(error, 'getStatus') === 'function'
    );
  }
}
