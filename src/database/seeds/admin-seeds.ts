import { Permissions } from '@/modules/permissions/entities/permission.entity';
import { Role } from '@/modules/roles/entities/role.entity';
import { User } from '@/modules/users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { AppDataSource } from '../data-source';

function requiredSeedValue(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required to run the admin seed.`);
  }

  return value;
}

async function seed(): Promise<void> {
  const username = requiredSeedValue('ADMIN_USERNAME');
  const password = requiredSeedValue('ADMIN_PASSWORD');
  const staffId = requiredSeedValue('ADMIN_STAFF_ID');

  if (password.length < 12) {
    throw new Error('ADMIN_PASSWORD must contain at least 12 characters.');
  }

  await AppDataSource.initialize();

  try {
    const roleRepository = AppDataSource.getRepository(Role);
    const userRepository = AppDataSource.getRepository(User);
    const permissionRepository = AppDataSource.getRepository(Permissions);

    let adminPermission = await permissionRepository.findOne({
      where: { name: 'system:admin' },
    });

    if (!adminPermission) {
      adminPermission = await permissionRepository.save(
        permissionRepository.create({
          name: 'system:admin',
          module: 'system',
          action: 'admin',
          description: 'Full admin permissions',
        }),
      );
    }

    let adminRole = await roleRepository.findOne({
      where: { name: 'ADMIN' },
      relations: { permissions: true },
    });

    if (!adminRole) {
      adminRole = roleRepository.create({
        name: 'ADMIN',
        description: 'Full admin role',
        permissions: [adminPermission],
      });
      adminRole = await roleRepository.save(adminRole);
    } else if (
      !adminRole.permissions.some(
        (permission) => permission.name === adminPermission.name,
      )
    ) {
      adminRole.permissions = [...adminRole.permissions, adminPermission];
      adminRole = await roleRepository.save(adminRole);
    }

    const existingAdmin = await userRepository.findOne({
      where: [{ username }, { staffId }],
    });

    if (existingAdmin) {
      if (
        existingAdmin.username !== username ||
        existingAdmin.staffId !== staffId
      ) {
        throw new Error(
          'ADMIN_USERNAME or ADMIN_STAFF_ID is already assigned to another user.',
        );
      }

      console.log('Admin seed completed; the configured admin already exists.');
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await userRepository.save(
      userRepository.create({
        staffId,
        username,
        passwordHash,
        role: adminRole,
        isActive: true,
      }),
    );

    console.log('Admin seed completed; the configured admin was created.');
  } finally {
    await AppDataSource.destroy();
  }
}

void seed().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : 'Unknown seed error.';
  console.error(`Admin seed failed: ${message}`);
  process.exitCode = 1;
});
