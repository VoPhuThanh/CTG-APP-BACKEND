import { AppErrorCode } from './app-error-code';

export const AppErrorMessage: Record<AppErrorCode, string> = {
  [AppErrorCode.AUTH_REQUIRED]: 'Authentication required.',
  [AppErrorCode.CURRENT_USER_NOT_FOUND]: 'Current user not found.',
  [AppErrorCode.INVALID_CREDENTIALS]: 'Invalid username or password.',
  [AppErrorCode.USER_DEACTIVATED]: 'User is deactivated.',

  [AppErrorCode.USER_NOT_FOUND]: 'User not found.',
  [AppErrorCode.USER_USERNAME_ALREADY_EXISTS]: 'Username already exists.',
  [AppErrorCode.USER_STAFF_ID_ALREADY_EXISTS]: 'Staff ID already exists.',

  [AppErrorCode.ROLE_NOT_FOUND]: 'Role not found.',
  [AppErrorCode.ROLE_NAME_ALREADY_EXISTS]: 'Role name already exists.',

  [AppErrorCode.PERMISSION_NOT_FOUND]: 'Permission not found.',
  [AppErrorCode.PERMISSION_NAME_ALREADY_EXISTS]:
    'Permission name already exists.',

  [AppErrorCode.ORDERING_IDS_INVALID]:
    'orderedIds must be a non-empty array of unique UUIDs.',
  [AppErrorCode.ORDERING_COLLECTION_MISMATCH]:
    'orderedIds must exactly match every active record in the selected ordering scope.',

  [AppErrorCode.FACILITY_NOT_FOUND]: 'Facility not found.',
  [AppErrorCode.FACILITY_SLUG_ALREADY_EXISTS]: 'Facility slug already exists.',
  [AppErrorCode.SERVICE_NOT_FOUND]: 'Service not found.',
  [AppErrorCode.SERVICE_SLUG_ALREADY_EXISTS]: 'Service slug already exists.',
  [AppErrorCode.SERVICE_VARIANT_NOT_FOUND]: 'Service variant not found.',
  [AppErrorCode.SERVICE_VARIANT_SLUG_ALREADY_EXISTS]:
    'Service variant slug already exists.',
  [AppErrorCode.SERVICE_VARIANT_CLUB_NOT_IN_SERVICE]:
    'Every service variant club must belong to the parent service.',

  [AppErrorCode.CLUB_NOT_FOUND]: 'Club not found.',
  [AppErrorCode.CLUB_SLUG_ALREADY_EXISTS]: 'Club slug already exists.',
  [AppErrorCode.CLUB_GALLERY_ORDER_INVALID]:
    'Club gallery displayOrder values must be unique and consecutive from zero.',

  [AppErrorCode.MEMBERSHIP_LEVEL_NOT_FOUND]: 'Membership level not found.',
  [AppErrorCode.MEMBERSHIP_LEVEL_SLUG_ALREADY_EXISTS]:
    'Membership level slug already exists.',

  [AppErrorCode.MEMBERSHIP_BENEFIT_NOT_FOUND]: 'Membership benefit not found.',

  [AppErrorCode.MEMBERSHIP_PLAN_NOT_FOUND]: 'Membership plan not found.',
  [AppErrorCode.MEMBERSHIP_PLAN_ALREADY_EXISTS]:
    'Membership plan already exists for this level and duration.',

  [AppErrorCode.BANNER_NOT_FOUND]: 'Banner not found.',
  [AppErrorCode.BANNER_INVALID_DATE_RANGE]:
    'Banner expiredAt must be later than publishedAt.',

  [AppErrorCode.CUSTOMER_LEAD_NOT_FOUND]: 'Customer lead not found.',
  [AppErrorCode.CUSTOMER_LEAD_CONSENT_REQUIRED]:
    'Customer consent is required before submitting the form.',

  [AppErrorCode.CONTACT_NOT_FOUND]: 'Contact content not found.',

  [AppErrorCode.MEDIA_ASSET_NOT_FOUND]: 'Media asset not found.',
  [AppErrorCode.MEDIA_ASSET_NOT_IMAGE]:
    'The selected media asset must be an image.',
  [AppErrorCode.MEDIA_ASSET_INACTIVE]:
    'Inactive media assets cannot be selected for a new placement.',
  [AppErrorCode.MEDIA_ASSET_IN_USE]:
    'Media asset cannot be deleted while it is referenced.',
  [AppErrorCode.MEDIA_ASSET_FILE_REQUIRED]: 'An image file is required.',
  [AppErrorCode.MEDIA_ASSET_FILE_TOO_LARGE]:
    'The image exceeds the configured file-size limit.',
  [AppErrorCode.MEDIA_ASSET_UNSUPPORTED_IMAGE_TYPE]:
    'The image format is not supported.',
  [AppErrorCode.MEDIA_ASSET_INVALID_IMAGE]:
    'The uploaded file is not a valid supported raster image.',
  [AppErrorCode.MEDIA_ASSET_MIME_MISMATCH]:
    'The declared MIME type does not match the uploaded image content.',
  [AppErrorCode.MEDIA_ASSET_MANAGED_FILE_IMMUTABLE]:
    'Managed file metadata cannot be changed through the metadata update endpoint.',
  [AppErrorCode.MEDIA_ASSET_INVALID_CROP_RECTANGLE]:
    'Crop coordinates and dimensions must be finite whole pixels with positive dimensions.',
  [AppErrorCode.MEDIA_ASSET_CROP_OUT_OF_BOUNDS]:
    'The crop rectangle must be fully inside the normalized, rotated original image.',
  [AppErrorCode.MEDIA_ASSET_CROP_UNSUPPORTED_IMAGE_TYPE]:
    'Cropping supports only non-animated JPEG, PNG, and WebP images.',
  [AppErrorCode.MEDIA_ASSET_ORIGINAL_UNAVAILABLE]:
    'The preserved original image is unavailable for this media asset.',
  [AppErrorCode.MEDIA_ASSET_UNMANAGED_OR_EXTERNAL]:
    'External or unmanaged media assets cannot be cropped.',
  [AppErrorCode.MEDIA_ASSET_IMAGE_PROCESSING_FAILED]:
    'The image could not be processed.',
  [AppErrorCode.MEDIA_ASSET_ORIGINAL_STORAGE_RETRIEVAL_FAILED]:
    'The preserved original image could not be loaded from storage.',

  [AppErrorCode.SITE_SETTING_NOT_FOUND]: 'Site setting not found.',
  [AppErrorCode.SITE_SETTING_KEY_ALREADY_EXISTS]:
    'Site setting key already exists.',
  [AppErrorCode.SITE_SETTING_NOT_EDITABLE]:
    'This site setting is not editable.',
  [AppErrorCode.SITE_SETTING_INVALID_VALUE]:
    'Site setting value does not match its value type.',

  [AppErrorCode.POST_CATEGORY_NOT_FOUND]: 'Post category not found.',
  [AppErrorCode.POST_CATEGORY_SLUG_ALREADY_EXISTS]:
    'Post category slug already exists.',
  [AppErrorCode.POST_CATEGORY_IN_USE]:
    'Post category cannot be deleted because it still has posts.',

  [AppErrorCode.POST_NOT_FOUND]: 'Post not found.',
  [AppErrorCode.POST_SLUG_ALREADY_EXISTS]: 'Post slug already exists.',
  [AppErrorCode.POST_CONTENT_TOO_LARGE]:
    'Post HTML content exceeds the supported size limit.',
  [AppErrorCode.POST_INLINE_MEDIA_MARKER_INVALID]:
    'Post inline media markers must contain a valid media asset UUID.',
};
