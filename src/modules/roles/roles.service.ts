import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { In, type Repository } from 'typeorm';
import { mapRoleToResponse, mapRolesToResponses } from './roles.mapper';
import { ErrorCode } from '@/cores/constants/error-code.constant';
import type { RoleReponseDto } from './dtos/role.dto';
import type { RoleCreateDto } from './dtos/create-role.dto';
import { HandleError } from '@/cores/serializers/errors/handle.errors';
import type { RoleUpdateDto } from './dtos/update-role.dto';
import { Permissions } from '../permissions/entities/permission.entity';
import type { UpdateRolePermissionDto } from './dtos/update-role-permission.dto';
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
    const [roles, totalItems] = await this.roleRepository.findAndCount({
      relations: {
        permissions: true,

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
      mapRolesToResponses(roles),
      totalItems,
      query,
    );
  }

  private async findEntityById(id: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: { permissions: true, createdBy: true, updatedBy: true },
    });
    if (!role) {
      throw new NotFoundException({
        statusCode: 404,
        code: ErrorCode.USER_NOT_FOUND,
        message: 'role not found',
      });
    }
    return role;
  }

  async findOne(id: string): Promise<RoleReponseDto> {
    const role = await this.findEntityById(id);
    return mapRoleToResponse(role);
  }

  async create(
    dto: RoleCreateDto,
    currentUser: AuthenticatedUser,
  ): Promise<RoleReponseDto> {
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
    const existingRole = await this.roleRepository.findOne({
      where: { name: dto.name },
    });
    if (existingRole) {
      throw HandleError.badRequest({
        code: 'DATA.DATA_ALREADY_EXIST',
      });
    }
    const permissions = await this.permissionRepository.find({
      where: {
        id: In(dto.permissionId),
      },
    });
    if (permissions.length !== dto.permissionId.length) {
      throw HandleError.badRequest({
        code: 'DATA.PERMISSION_DOESNT_EXIST',
      });
    }
    const role = this.roleRepository.create({
      name: dto.name,
      description: dto.description,
      permissions,
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
    const role = await this.findEntityById(id);

    if (dto.name) role.name = dto.name;
    if (dto.description) role.description = dto.description;
    await this.roleRepository.save(role);

    return this.findOne(role.id);
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
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: {
        permissions: true,
      },
    });
    if (!role) {
      throw new NotFoundException({
        statusCode: 404,
        code: ErrorCode.USER_NOT_FOUND,
        message: 'role not found',
      });
    }
    const permissions = await this.permissionRepository.find({
      where: {
        id: In(dto.permissionId),
      },
    });
    if (permissions.length !== dto.permissionId.length) {
      throw HandleError.badRequest({
        code: 'DATA.PERMISSION_DOESNT_EXIST',
      });
    }
    role.permissions = permissions;
    role.updatedBy = updater;
    role.updatedAt = new Date();
    await this.roleRepository.save(role);
    return this.findOne(role.id);
  }
}
