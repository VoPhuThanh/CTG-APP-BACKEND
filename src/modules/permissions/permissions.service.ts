import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { AppError } from '@/cores/errors/app-error';
import { AppErrorCode } from '@/cores/errors/app-error-code';
import { PaginationQueryDto } from '@/cores/pagination/pagination-query.dto';
import { PaginatedResponseDto } from '@/cores/pagination/pagination-response.dto';
import {
  buildPaginatedResponse,
  getPaginationSkip,
  getPaginationTake,
} from '@/cores/pagination/pagination-utils';

import { AuthenticatedUser } from '../auth/interfaces/authenticated-users.interface';
import { User } from '../users/entities/user.entity';
import type { PermissionCreateDto } from './dtos/create-permission.dto';
import type { PermissionResponseDto } from './dtos/permission.dto';
import type { PermissionUpdateDto } from './dtos/update-permission.dto';
import { Permissions } from './entities/permission.entity';
import {
  mapPermissionsToReponses,
  mapPermissionToReponse,
} from './permissions.mapper';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Permissions)
    private readonly permissionRepository: Repository<Permissions>,
  ) {}

  async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<PermissionResponseDto>> {
    const search = query.search?.trim();

    const queryBuilder = this.permissionRepository
      .createQueryBuilder('permission')
      .leftJoinAndSelect('permission.createdBy', 'createdBy')
      .leftJoinAndSelect('permission.updatedBy', 'updatedBy');

    if (search) {
      queryBuilder.andWhere(
        `(
        permission.name ILIKE :search
        OR permission.module ILIKE :search
        OR permission.action ILIKE :search
        OR permission.description ILIKE :search
      )`,
        {
          search: `%${search}%`,
        },
      );
    }

    queryBuilder
      .addSelect(
        `CASE WHEN permission.action = 'all' THEN 0 ELSE 1 END`,
        'permission_sort_priority',
      )
      .orderBy('permission_sort_priority', 'ASC')
      .addOrderBy('permission.module', 'ASC')
      .addOrderBy('permission.action', 'ASC')
      .addOrderBy('permission.name', 'ASC')
      .skip(getPaginationSkip(query))
      .take(getPaginationTake(query));

    const [permissions, totalItems] = await queryBuilder.getManyAndCount();

    return buildPaginatedResponse(
      mapPermissionsToReponses(permissions),
      totalItems,
      query,
    );
  }

  async findOne(id: string): Promise<PermissionResponseDto> {
    const permission = await this.findEntityById(id);

    return mapPermissionToReponse(permission);
  }

  async create(
    dto: PermissionCreateDto,
    currentUser: AuthenticatedUser,
  ): Promise<PermissionResponseDto> {
    const creator = await this.findCurrentUserOrThrow(currentUser);

    await this.ensurePermissionNameIsAvailable(dto.name);

    const permission = this.permissionRepository.create({
      name: dto.name,
      description: dto.description,
      module: dto.module,
      action: dto.action,
      createdBy: creator,
      updatedBy: creator,
    });

    await this.permissionRepository.save(permission);

    return this.findOne(permission.id);
  }

  async update(
    id: string,
    dto: PermissionUpdateDto,
    currentUser: AuthenticatedUser,
  ): Promise<PermissionResponseDto> {
    const updater = await this.findCurrentUserOrThrow(currentUser);
    const permission = await this.findEntityById(id);

    if (dto.name && dto.name !== permission.name) {
      await this.ensurePermissionNameIsAvailable(dto.name);
      permission.name = dto.name;
    }

    if (dto.description !== undefined) {
      permission.description = dto.description;
    }

    if (dto.module) {
      permission.module = dto.module;
    }

    if (dto.action) {
      permission.action = dto.action;
    }

    permission.updatedBy = updater;

    await this.permissionRepository.save(permission);

    return this.findOne(permission.id);
  }

  async delete(id: string, currentUser: AuthenticatedUser): Promise<void> {
    const deleter = await this.findCurrentUserOrThrow(currentUser);
    const permission = await this.findEntityById(id);

    await this.permissionRepository.manager.transaction(async (manager) => {
      await manager.update(Permissions, permission.id, {
        deletedBy: deleter,
      });

      await manager.softDelete(Permissions, permission.id);
    });
  }

  private async findEntityById(id: string): Promise<Permissions> {
    const permission = await this.permissionRepository.findOne({
      where: {
        id,
      },
      relations: {
        createdBy: true,
        updatedBy: true,
      },
    });

    if (!permission) {
      throw AppError.notFound(AppErrorCode.PERMISSION_NOT_FOUND);
    }

    return permission;
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

  private async ensurePermissionNameIsAvailable(name: string): Promise<void> {
    const existingPermission = await this.permissionRepository.findOne({
      where: {
        name,
      },
    });

    if (existingPermission) {
      throw AppError.conflict(AppErrorCode.PERMISSION_NAME_ALREADY_EXISTS);
    }
  }
}
