import { AppDataSource } from '../data-source';
import { Permissions } from '../../modules/permissions/entities/permission.entity';

type PermissionSeed = {
  name: string;
  module: string;
  action: string;
  description: string;
};

const CRUD_ACTIONS = ['read', 'create', 'update', 'delete'] as const;

const MODULES = [
  'facilities',
  'services',
  'clubs',
  'memberships',
  'banners',
  'customer-leads',
  'media-assets',
  'site-settings',
  'posts',
  'auth',
  'users',
  'roles',
  'permissions',
] as const;

function buildModulePermissions(
  module: string,
  actions: readonly string[] = CRUD_ACTIONS,
): PermissionSeed[] {
  const modulePermissions = actions.map((action) => ({
    name: `${module}:${action}`,
    module,
    action,
    description: `${module}:${action}`,
  }));

  return [
    {
      name: `${module}:*`,
      module,
      action: 'all',
      description: `${module}:*`,
    },
    ...modulePermissions,
  ];
}

function buildPermissionSeeds(): PermissionSeed[] {
  return [
    {
      name: 'system:admin',
      module: 'system',
      action: 'admin',
      description: 'system:admin',
    },

    // Keep this because Roles has a dedicated permission assignment endpoint.
    // It is outside the normal CRUD action set.
    {
      name: 'roles:update-permissions',
      module: 'roles',
      action: 'update-permissions',
      description: 'roles:update-permissions',
    },

    ...MODULES.flatMap((module) => buildModulePermissions(module)),
    ...buildModulePermissions('contacts', ['read', 'update', 'delete']),
  ];
}

async function seedPermissions() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const permissionRepository = AppDataSource.getRepository(Permissions);
  const permissions = buildPermissionSeeds();

  await permissionRepository
    .createQueryBuilder()
    .insert()
    .into(Permissions)
    .values(permissions)
    .orIgnore()
    .execute();

  console.log(
    `Permission seed completed. Checked ${permissions.length} permissions.`,
  );
}

seedPermissions()
  .catch((error) => {
    console.error('Permission seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });
