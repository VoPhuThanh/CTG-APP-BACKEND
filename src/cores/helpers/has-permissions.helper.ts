const SYSTEM_ADMIN_PERMISSION = 'system:admin';

export function hasPermission(
  userPermission: Set<string>,
  requiredPermission: string,
): boolean {
  if (userPermission.has(SYSTEM_ADMIN_PERMISSION)) return true;

  if (userPermission.has(requiredPermission)) return true;

  const [module] = requiredPermission.split(':');
  const moduleWildcardPermission = `${module}:*`;

  if (userPermission.has(moduleWildcardPermission)) return true;

  return false;
}
