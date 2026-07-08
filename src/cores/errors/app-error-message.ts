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
};
