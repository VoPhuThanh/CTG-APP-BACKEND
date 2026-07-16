export enum MediaAssetReferenceEntityType {
  SERVICE = 'service',
  SERVICE_VARIANT = 'service_variant',
  POST = 'post',
}

export enum MediaAssetReferenceSlot {
  SERVICE_IMAGE = 'service.image',
  SERVICE_VARIANT_IMAGE = 'service_variant.image',
  SERVICE_VARIANT_BANNER_IMAGE = 'service_variant.banner_image',
  SERVICE_VARIANT_MODEL_IMAGE = 'service_variant.model_image',
  POST_COVER_IMAGE = 'post.cover_image',
  POST_INLINE_CONTENT_IMAGE = 'post.inline_content_image',
}

export enum MediaAssetSelectionWarningCode {
  USAGE_MISMATCH = 'MEDIA_ASSET.USAGE_MISMATCH',
}
