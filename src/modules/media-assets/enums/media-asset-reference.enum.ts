export enum MediaAssetReferenceEntityType {
  BANNER = 'banner',
  CLUB = 'club',
  FACILITY = 'facility',
  MEMBERSHIP_LEVEL = 'membership_level',
  SERVICE = 'service',
  SERVICE_VARIANT = 'service_variant',
  SITE_SETTING = 'site_setting',
  POST = 'post',
}

export enum MediaAssetReferenceSlot {
  BANNER_IMAGE = 'banner.image',
  BANNER_MOBILE_IMAGE = 'banner.mobile_image',
  CLUB_COVER_IMAGE = 'club.cover_image',
  CLUB_GALLERY_IMAGE = 'club.gallery_image',
  FACILITY_COVER_IMAGE = 'facility.cover_image',
  MEMBERSHIP_LEVEL_IMAGE = 'membership_level.image',
  SERVICE_IMAGE = 'service.image',
  SERVICE_VARIANT_IMAGE = 'service_variant.image',
  SERVICE_VARIANT_BANNER_IMAGE = 'service_variant.banner_image',
  SERVICE_VARIANT_MODEL_IMAGE = 'service_variant.model_image',
  POST_COVER_IMAGE = 'post.cover_image',
  POST_INLINE_CONTENT_IMAGE = 'post.inline_content_image',
  SITE_SETTING_MEDIA_ASSET = 'site_setting.media_asset',
}

export enum MediaAssetSelectionWarningCode {
  USAGE_MISMATCH = 'MEDIA_ASSET.USAGE_MISMATCH',
}
