import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Permissions } from './entities/permission.entity';
import type { Repository } from 'typeorm';
import {
  mapPermissionsToReponses,
  mapPermissionToReponse,
} from './permissions.mapper';
import { ErrorCode } from '@/cores/constants/error-code.constant';
import type { PermissionCreateDto } from './dtos/create-permission.dto';
import type { PermissionResponseDto } from './dtos/permission.dto';
import { HandleError } from '@/cores/serializers/errors/handle.errors';
import type { PermissionUpdateDto } from './dtos/update-permission.dto';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-users.interface';
import { User } from '../users/entities/user.entity';
import { PaginationQueryDto } from '@/cores/pagination/pagination-query.dto';
import { PaginatedResponseDto } from '@/cores/pagination/pagination-response.dto';
import {
  buildPaginatedResponse,
  getPaginationSkip,
  getPaginationTake,
} from '@/cores/pagination/pagination-utils';

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
    const [permissions, totalItems] =
      await this.permissionRepository.findAndCount({
        relations: {
          createdBy: true,
          updatedBy: true,
        },
        order: {
          createdAt: 'DESC',
        },
        skip: getPaginationSkip(query),
        take: getPaginationTake(query),
      });

    return buildPaginatedResponse(
      mapPermissionsToReponses(permissions),
      totalItems,
      query,
    );
  }
  private async findEntityById(id: string): Promise<Permissions> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
    });
    if (!permission) {
      throw new NotFoundException({
        statusCode: 404,
        code: ErrorCode.USER_NOT_FOUND,
        message: 'permission not found',
      });
    }
    return permission;
  }
  async findOne(id: string): Promise<PermissionResponseDto> {
    const permission = await this.findEntityById(id);
    return mapPermissionToReponse(permission);
  }
  async create(
    dto: PermissionCreateDto,
    currentUser: AuthenticatedUser,
  ): Promise<PermissionResponseDto> {
    if (!currentUser?.id) {
      throw new UnauthorizedException('Authentication required');
    }
    const creator = await this.userRepository.findOne({
      where: {
        id: currentUser.id,
      },
    });
    if (!creator) {
      throw new UnauthorizedException('Current user not found');
    }
    const existingPermission = await this.permissionRepository.findOne({
      where: {
        name: dto.name,
      },
    });
    if (existingPermission) {
      throw HandleError.badRequest({
        code: 'DATA.DATA_ALREADY_EXIST',
      });
    }
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
    if (!currentUser?.id) {
      throw new UnauthorizedException('Authentication required');
    }
    const updater = await this.userRepository.findOne({
      where: {
        id: currentUser.id,
      },
    });
    if (!updater) {
      throw new UnauthorizedException('Current user not found');
    }
    const permission = await this.findEntityById(id);

    if (dto.name) permission.name = dto.name;
    if (dto.description) permission.description = dto.description;
    if (dto.module) permission.module = dto.module;
    if (dto.action) permission.action = dto.action;

    permission.updatedBy = updater;

    await this.permissionRepository.save(permission);
    return this.findOne(permission.id);
  }
  async delete(id: string, currentUser: AuthenticatedUser): Promise<void> {
    if (!currentUser?.id) {
      throw new UnauthorizedException('Authentication required');
    }
    const deleter = await this.userRepository.findOne({
      where: {
        id: currentUser.id,
      },
    });
    if (!deleter) {
      throw new UnauthorizedException('Current user not found');
    }
    const permission = await this.findEntityById(id);

    await this.permissionRepository.manager.transaction(async (manager) => {
      await manager.update(Permissions, permission.id, {
        deletedBy: deleter,
      });
      await manager.softDelete(Permissions, permission.id);
    });
  }
}
