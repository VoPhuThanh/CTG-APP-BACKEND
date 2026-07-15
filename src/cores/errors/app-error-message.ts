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

  [AppErrorCode.MEDIA_ASSET_NOT_FOUND]: 'Media asset not found.',

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
};
