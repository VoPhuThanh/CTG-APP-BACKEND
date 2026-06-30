import { Permissions } from '@/modules/permissions/entities/permission.entity';
import { AppDataSource } from '../data-source';
import { Role } from '@/modules/roles/entities/role.entity';
import { User } from '@/modules/users/entities/user.entity';
import * as bcrypt from 'bcrypt';

async function seed() {
  await AppDataSource.initialize();

  const roleRepository = AppDataSource.getRepository(Role);

  const userRepository = AppDataSource.getRepository(User);

  const permissionRepository = AppDataSource.getRepository(Permissions);

  let adminPermissions = await permissionRepository.findOne({
    where: {
      name: 'ADMIN',
    },
  });

  if (!adminPermissions) {
    adminPermissions = permissionRepository.create({
      name: 'ADMIN_PERM',
      description: 'Full admin permissions',
    });

    await permissionRepository.save(adminPermissions);
  }

  let adminRole = await roleRepository.findOne({
    where: {
      name: 'ADMIN',
    },
    relations: {
      permissions: true,
    },
  });

  if (!adminRole) {
    adminRole = roleRepository.create({
      name: 'ADMIN',
      description: 'Full admin role',
    });

    adminRole.permissions = [adminPermissions];
    await roleRepository.save(adminRole);
  }

  const existingAdmin = await userRepository.findOne({
    where: {
      username: 'admin',
    },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('PhuThanh2004', 12);

    const adminUser = userRepository.create({
      username: 'admin',

      passwordHash,

      role: adminRole,
    });

    await userRepository.save(adminUser);
  }

  console.log('Initial seed completed');

  await AppDataSource.destroy();
}

seed();
