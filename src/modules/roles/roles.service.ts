import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, type Repository } from 'typeorm';

import { ROLE_SORT_FIELDS } from '@/cores/constants/sorting.constant';
import { AppError } from '@/cores/errors/app-error';
import { AppErrorCode } from '@/cores/errors/app-error-code';
import { PaginationQueryDto } from '@/cores/pagination/pagination-query.dto';
import { PaginatedResponseDto } from '@/cores/pagination/pagination-response.dto';
import {
  buildPaginatedResponse,
  getPaginatedIds,
  orderEntitiesByIds,
} from '@/cores/pagination/pagination-utils';

import { AuthenticatedUser } from '../auth/interfaces/authenticated-users.interface';
import { Permissions } from '../permissions/entities/permission.entity';
import { User } from '../users/entities/user.entity';
import type { RoleCreateDto } from './dtos/create-role.dto';
import type { RoleReponseDto } from './dtos/role.dto';
import type { RoleUpdateDto } from './dtos/update-role.dto';
import type { UpdateRolePermissionDto } from './dtos/update-role-permission.dto';
import { Role } from './entities/role.entity';
import { mapRoleToResponse, mapRolesToResponses } from './roles.mapper';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,

    @InjectRepository(Permissions)
    private readonly permissionRepository: Repository<Permissions>,
  ) {}

  async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<RoleReponseDto>> {
    const sortBy = query.sortBy;
    const sortOrder = query.sortOrder ?? 'ASC';
    const search = query.search?.trim();

    const queryBuilder = this.roleRepository.createQueryBuilder('role');

    if (search) {
      queryBuilder.andWhere(
        `(
        role.name ILIKE :search
        OR role.description ILIKE :search
      )`,
        {
          search: `%${search}%`,
        },
      );
    }

    if (sortBy && sortBy in ROLE_SORT_FIELDS) {
      queryBuilder.orderBy(
        `role.${ROLE_SORT_FIELDS[sortBy as keyof typeof ROLE_SORT_FIELDS]}`,
        sortOrder,
      );
    } else {
      queryBuilder.orderBy('role.createdAt', 'DESC');
    }

    queryBuilder.addOrderBy('role.id', 'ASC');

    const { ids: pageIds, totalItems } = await getPaginatedIds(
      queryBuilder,
      'role',
      query,
    );

    const loadedRoles =
      pageIds.length === 0
        ? []
        : await this.roleRepository.find({
            where: {
              id: In(pageIds),
            },
            relations: {
              permissions: true,
              createdBy: true,
              updatedBy: true,
            },
          });

    const roles = orderEntitiesByIds(loadedRoles, pageIds);

    return buildPaginatedResponse(
      mapRolesToResponses(roles),
      totalItems,
      query,
    );
  }

  async findOne(id: string): Promise<RoleReponseDto> {
    const role = await this.findEntityById(id);

    return mapRoleToResponse(role);
  }

  async create(
    dto: RoleCreateDto,
    currentUser: AuthenticatedUser,
  ): Promise<RoleReponseDto> {
    const creator = await this.findCurrentUserOrThrow(currentUser);

    await this.ensureRoleNameIsAvailable(dto.name);

    const role = this.roleRepository.create({
      name: dto.name,
      description: dto.description,
      createdBy: creator,
      updatedBy: creator,
    });

    await this.roleRepository.save(role);

    return this.findOne(role.id);
  }

  async update(
    id: string,
    dto: RoleUpdateDto,
    currentUser: AuthenticatedUser,
  ): Promise<RoleReponseDto> {
    const updater = await this.findCurrentUserOrThrow(currentUser);
    const role = await this.findEntityById(id);

    if (dto.name && dto.name !== role.name) {
      await this.ensureRoleNameIsAvailable(dto.name);
      role.name = dto.name;
    }

    if (dto.description !== undefined) {
      role.description = dto.description;
    }

    role.updatedBy = updater;

    await this.roleRepository.save(role);

    return this.findOne(role.id);
  }

  async delete(id: string, currentUser: AuthenticatedUser): Promise<void> {
    const deleter = await this.findCurrentUserOrThrow(currentUser);
    const role = await this.findEntityById(id);

    await this.roleRepository.manager.transaction(async (manager) => {
      await manager.update(Role, role.id, {
        deletedBy: deleter,
      });

      await manager.softDelete(Role, role.id);
    });
  }

  async permissionAssign(
    id: string,
    dto: UpdateRolePermissionDto,
    currentUser: AuthenticatedUser,
  ): Promise<RoleReponseDto> {
    const updater = await this.findCurrentUserOrThrow(currentUser);

    const role = await this.roleRepository.findOne({
      where: {
        id,
      },
      relations: {
        permissions: true,
      },
    });

    if (!role) {
      throw AppError.notFound(AppErrorCode.ROLE_NOT_FOUND);
    }

    const permissions = await this.permissionRepository.find({
      where: {
        id: In(dto.permissionId),
      },
    });

    if (permissions.length !== dto.permissionId.length) {
      throw AppError.notFound(AppErrorCode.PERMISSION_NOT_FOUND);
    }

    role.permissions = permissions;
    role.updatedBy = updater;

    await this.roleRepository.save(role);

    return this.findOne(role.id);
  }

  private async findEntityById(id: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: {
        id,
      },
      relations: {
        permissions: true,
        createdBy: true,
        updatedBy: true,
      },
    });

    if (!role) {
      throw AppError.notFound(AppErrorCode.ROLE_NOT_FOUND);
    }

    return role;
  }

  private async findCurrentUserOrThrow(
    currentUser: AuthenticatedUser,
  ): Promise<User> {
    if (!currentUser?.id) {
      throw AppError.unauthorized(AppErrorCode.AUTH_REQUIRED);
    }

    const user = await this.userRepository.findOne({
      where: {
        id: currentUser.id,
      },
    });

    if (!user) {
      throw AppError.unauthorized(AppErrorCode.CURRENT_USER_NOT_FOUND);
    }

    return user;
  }

  private async ensureRoleNameIsAvailable(name: string): Promise<void> {
    const existingRole = await this.roleRepository.findOne({
      where: {
        name,
      },
    });

    if (existingRole) {
      throw AppError.conflict(AppErrorCode.ROLE_NAME_ALREADY_EXISTS);
    }
  }
}
