import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Permissions } from './entities/permission.entity';
import { Repository } from 'typeorm';
import {
  mapPermissionsToReponses,
  mapPermissionToReponse,
} from './permissions.mapper';
import { ErrorCode } from '@/cores/constants/error-code.constant';
import { PermissionCreateDto } from './dtos/create-permission.dto';
import { PermissionResponseDto } from './dtos/permission.dto';
import { HandleError } from '@/cores/serializers/errors/handle.errors';
import { PermissionUpdateDto } from './dtos/update-permission.dto';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permissions)
    private readonly permissionRepository: Repository<Permissions>,
  ) {}

  async findAll() {
    const permissions = await this.permissionRepository.find({});
    return mapPermissionsToReponses(permissions);
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
  async create(dto: PermissionCreateDto): Promise<PermissionResponseDto> {
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
    });
    await this.permissionRepository.save(permission);
    return this.findOne(permission.id);
  }
  async update(
    id: string,
    dto: PermissionUpdateDto,
  ): Promise<PermissionResponseDto> {
    console.log(dto);
    const permission = await this.findEntityById(id);

    if (dto.name) permission.name = dto.name;
    if (dto.description) permission.description = dto.description;

    await this.permissionRepository.save(permission);
    return this.findOne(permission.id);
  }
  async delete(id: string): Promise<PermissionResponseDto> {
    const permission = await this.findEntityById(id);

    permission.deletedAt = new Date();

    await this.permissionRepository.save(permission);
    return mapPermissionToReponse(permission);
  }
}
