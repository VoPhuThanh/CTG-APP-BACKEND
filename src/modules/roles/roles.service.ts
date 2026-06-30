import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { In, Repository } from 'typeorm';
import { mapRoleToResponse, mapRolesToResponses } from './roles.mapper';
import { ErrorCode } from '@/cores/constants/error-code.constant';
import { RoleReponseDto } from './dtos/role.dto';
import { RoleCreateDto } from './dtos/create-role.dto';
import { HandleError } from '@/cores/serializers/errors/handle.errors';
import { RoleUpdateDto } from './dtos/update-role.dto';
import { Permissions } from '../permissions/entities/permission.entity';
import { UpdateRolePermissionDto } from './dtos/update-role-permission.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,

    @InjectRepository(Permissions)
    private readonly permissionRepository: Repository<Permissions>,
  ) {}

  async findAll() {
    const roles = await this.roleRepository.find({
      relations: {
        permissions: true,
      },
    });
    return mapRolesToResponses(roles);
  }

  private async findEntityById(id: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: { permissions: true },
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

  async create(dto: RoleCreateDto): Promise<RoleReponseDto> {
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
    });
    await this.roleRepository.save(role);
    return this.findOne(role.id);
  }

  async update(id: string, dto: RoleUpdateDto): Promise<RoleReponseDto> {
    const role = await this.findEntityById(id);

    if (dto.name) role.name = dto.name;
    if (dto.description) role.description = dto.description;
    if (dto.permissionId) {
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
    }

    await this.roleRepository.save(role);

    return this.findOne(role.id);
  }

  async delete(id: string): Promise<RoleReponseDto> {
    const role = await this.findEntityById(id);

    role.deletedAt = new Date();

    await this.roleRepository.save(role);
    return mapRoleToResponse(role);
  }

  async permissionAssign(
    id: string,
    dto: UpdateRolePermissionDto,
  ): Promise<RoleReponseDto> {
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
    await this.roleRepository.save(role);
    return this.findOne(role.id);
  }
}
