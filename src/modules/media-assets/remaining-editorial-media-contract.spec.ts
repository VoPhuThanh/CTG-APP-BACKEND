import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { getMetadataArgsStorage } from 'typeorm';

import { BannerUpdateDto } from '../banners/dtos/update-banner.dto';
import { Banner } from '../banners/entities/banner.entity';
import { ClubUpdateDto } from '../clubs/dtos/update-club.dto';
import { ClubGalleryMediaAsset } from '../clubs/entities/club-gallery-media-asset.entity';
import { Club } from '../clubs/entities/club.entity';
import { FacilityUpdateDto } from '../facilities/dtos/update-facility.dto';
import { Facility } from '../facilities/entities/facility.entity';
import { MembershipLevelUpdateDto } from '../memberships/dtos/update-membership-level.dto';
import { MembershipLevel } from '../memberships/entities/membership-level.entity';
import { SiteSettingCreateDto } from '../site-settings/dtos/create-site-setting.dto';
import { SiteSetting } from '../site-settings/entities/site-setting.entity';
import { SiteSettingValueType } from '../site-settings/enums/site-setting.enum';

describe('remaining editorial media contracts', () => {
  const firstAssetId = '2a446e27-e55b-43d1-87d8-4e01f1f75043';
  const secondAssetId = '3b557f38-f66c-44e2-98e9-5f12fa206154';

  it('keeps omission and explicit null valid for every fixed asset slot', async () => {
    const omitted = [
      new BannerUpdateDto(),
      new ClubUpdateDto(),
      new FacilityUpdateDto(),
      new MembershipLevelUpdateDto(),
    ];
    const cleared = [
      Object.assign(new BannerUpdateDto(), {
        imageAssetId: null,
        mobileImageAssetId: null,
      }),
      Object.assign(new ClubUpdateDto(), { coverImageAssetId: null }),
      Object.assign(new FacilityUpdateDto(), { coverImageAssetId: null }),
      Object.assign(new MembershipLevelUpdateDto(), { imageAssetId: null }),
    ];

    for (const dto of [...omitted, ...cleared]) {
      await expect(validate(dto)).resolves.toHaveLength(0);
    }
  });

  it('validates nested ordered gallery items and duplicate asset/order values', async () => {
    const valid = plainToInstance(ClubUpdateDto, {
      galleryMedia: [
        { mediaAssetId: firstAssetId, displayOrder: 0 },
        { mediaAssetId: secondAssetId, displayOrder: 1 },
      ],
    });
    const duplicate = plainToInstance(ClubUpdateDto, {
      galleryMedia: [
        { mediaAssetId: firstAssetId, displayOrder: 0 },
        { mediaAssetId: firstAssetId, displayOrder: 0 },
      ],
    });

    await expect(validate(valid)).resolves.toHaveLength(0);
    const errors = await validate(duplicate);
    expect(errors).toEqual([
      expect.objectContaining({ property: 'galleryMedia' }),
    ]);
  });

  it('keeps scalar and media-asset site-setting inputs structurally distinct', async () => {
    const scalar = plainToInstance(SiteSettingCreateDto, {
      key: 'site.name',
      group: 'general',
      labelEn: 'Site name',
      value: 'CTG Fitness',
      valueType: SiteSettingValueType.TEXT,
    });
    const media = plainToInstance(SiteSettingCreateDto, {
      key: 'forms.background',
      group: 'forms',
      labelEn: 'Form background',
      valueType: SiteSettingValueType.MEDIA_ASSET,
      mediaAssetId: firstAssetId,
    });

    await expect(validate(scalar)).resolves.toHaveLength(0);
    await expect(validate(media)).resolves.toHaveLength(0);
  });

  it('aligns nullable entity keys and ordered-gallery constraints with the migration contract', () => {
    const metadata = getMetadataArgsStorage();
    const expectedColumns: Array<
      [
        (
          | typeof Banner
          | typeof Club
          | typeof Facility
          | typeof MembershipLevel
          | typeof SiteSetting
        ),
        string,
      ]
    > = [
      [Banner, 'imageAssetId'],
      [Banner, 'mobileImageAssetId'],
      [Club, 'coverImageAssetId'],
      [Facility, 'coverImageAssetId'],
      [MembershipLevel, 'imageAssetId'],
      [SiteSetting, 'mediaAssetId'],
    ];

    for (const [target, propertyName] of expectedColumns) {
      expect(
        metadata.columns.find(
          (column) =>
            column.target === target && column.propertyName === propertyName,
        )?.options,
      ).toEqual(expect.objectContaining({ type: 'uuid', nullable: true }));
    }

    const galleryUniques = metadata.uniques
      .filter((unique) => unique.target === ClubGalleryMediaAsset)
      .map((unique) => unique.name);
    const galleryIndices = metadata.indices
      .filter((index) => index.target === ClubGalleryMediaAsset)
      .map((index) => index.name);

    expect(galleryUniques).toEqual(
      expect.arrayContaining([
        'UQ_club_gallery_media_asset',
        'UQ_club_gallery_display_order',
      ]),
    );
    expect(galleryIndices).toEqual(
      expect.arrayContaining([
        'IDX_club_gallery_media_assets_club_id',
        'IDX_club_gallery_media_assets_media_asset_id',
        'IDX_club_gallery_media_assets_order',
      ]),
    );
  });
});
