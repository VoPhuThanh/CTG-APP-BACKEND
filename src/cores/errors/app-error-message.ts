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
};
