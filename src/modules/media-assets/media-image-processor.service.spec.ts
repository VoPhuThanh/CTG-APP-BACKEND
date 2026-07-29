/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import sharp from 'sharp';

import { CropMediaAssetDto } from './dtos/crop-media-asset.dto';
import { MediaImageProcessor } from './media-image-processor.service';

describe('MediaImageProcessor', () => {
  const processor = new MediaImageProcessor();
  let source: Buffer;

  beforeAll(async () => {
    source = await sharp({
      create: {
        width: 4,
        height: 3,
        channels: 3,
        background: { r: 20, g: 40, b: 60 },
      },
    })
      .png()
      .toBuffer();
  });

  it('rotates normalized pixels, crops inside the rotated bounds, and emits WebP metadata', async () => {
    const result = await processor.crop(
      source,
      'image/png',
      Object.assign(new CropMediaAssetDto(), {
        x: 0,
        y: 1,
        width: 2,
        height: 3,
        rotation: 90,
        aspectRatio: 2 / 3,
        quality: 90,
      }),
    );

    expect(result).toEqual(
      expect.objectContaining({
        mimeType: 'image/webp',
        width: 2,
        height: 3,
        normalizedOriginalWidth: 4,
        normalizedOriginalHeight: 3,
        fileSizeBytes: result.buffer.length,
        checksum: expect.stringMatching(/^[0-9a-f]{64}$/),
        cropMetadata: {
          x: 0,
          y: 1,
          width: 2,
          height: 3,
          rotation: 90,
          aspectRatio: 2 / 3,
          outputFormat: 'webp',
          quality: 90,
        },
      }),
    );
    await expect(sharp(result.buffer).metadata()).resolves.toEqual(
      expect.objectContaining({ format: 'webp', width: 2, height: 3 }),
    );
  });

  it('rejects fractional crop coordinates with the crop-specific error', async () => {
    await expect(
      processor.crop(
        source,
        'image/png',
        Object.assign(new CropMediaAssetDto(), {
          x: 0.5,
          y: 0,
          width: 1,
          height: 1,
        }),
      ),
    ).rejects.toMatchObject({
      status: 400,
      response: expect.objectContaining({
        code: 'MEDIA_ASSET.INVALID_CROP_RECTANGLE',
      }),
    });
  });

  it('rejects unsupported crop source formats clearly', async () => {
    await expect(
      processor.crop(
        Buffer.from('GIF89a'),
        'image/gif',
        Object.assign(new CropMediaAssetDto(), {
          x: 0,
          y: 0,
          width: 1,
          height: 1,
        }),
      ),
    ).rejects.toMatchObject({
      status: 415,
      response: expect.objectContaining({
        code: 'MEDIA_ASSET.CROP_UNSUPPORTED_IMAGE_TYPE',
      }),
    });
  });
});
