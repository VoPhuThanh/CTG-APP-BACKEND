import { validate } from 'class-validator';

import { PostCreateDto } from '../posts/dtos/create-post.dto';
import { ServiceVariantUpdateDto } from '../services/dtos/update-service-variant.dto';
import { MediaAssetCreateDto } from './dtos/create-media-asset.dto';
import { MediaAssetUploadDto } from './dtos/upload-media-asset.dto';

describe('editorial media DTO contracts', () => {
  const assetId = '2a446e27-e55b-43d1-87d8-4e01f1f75043';

  it('keeps manual creation transitional and reserves managed metadata for upload', async () => {
    const legacy = Object.assign(new MediaAssetCreateDto(), {
      name: 'Legacy external image',
      url: 'https://example.com/legacy.jpg',
    });
    const managed = Object.assign(new MediaAssetUploadDto(), {
      name: 'Managed image',
    });
    const attemptedManualManagedRecord = Object.assign(
      new MediaAssetCreateDto(),
      {
        name: 'Invalid manual managed image',
        url: '/uploads/media/images/managed.webp',
        storageKey: 'images/managed.webp',
      },
    );

    await expect(validate(legacy)).resolves.toHaveLength(0);
    await expect(validate(managed)).resolves.toHaveLength(0);
    const errors = await validate(attemptedManualManagedRecord, {
      whitelist: true,
    });
    expect(errors).toEqual([
      expect.objectContaining({ property: 'storageKey' }),
    ]);
  });

  it('accepts bilingual HTML and a managed post cover asset id', async () => {
    const dto = Object.assign(new PostCreateDto(), {
      titleEn: 'Training safely',
      titleVi: 'Tap luyen an toan',
      categoryId: '62afe72e-63f6-45b7-a75b-9a0ac93e2525',
      contentHtmlEn: '<p>Train safely.</p>',
      contentHtmlVi: '<p>Tap luyen an toan.</p>',
      coverImageAssetId: assetId,
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('preserves omitted-versus-null semantics for fixed asset slots', async () => {
    const omitted = new ServiceVariantUpdateDto();
    const cleared = Object.assign(new ServiceVariantUpdateDto(), {
      imageAssetId: null,
      bannerImageAssetId: null,
      modelImageAssetId: null,
    });

    await expect(validate(omitted)).resolves.toHaveLength(0);
    await expect(validate(cleared)).resolves.toHaveLength(0);
  });

  it('rejects a malformed managed asset id', async () => {
    const dto = Object.assign(new ServiceVariantUpdateDto(), {
      imageAssetId: 'not-a-uuid',
    });

    const errors = await validate(dto);
    expect(errors).toEqual([
      expect.objectContaining({ property: 'imageAssetId' }),
    ]);
  });
});
