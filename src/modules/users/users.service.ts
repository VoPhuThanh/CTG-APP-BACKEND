import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { type Repository } from 'typeorm';

import { USER_SORT_FIELDS } from '@/cores/constants/sorting.constant';
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
import { Role } from '../roles/entities/role.entity';
import type { UserCreateDto } from './dtos/create-users.dto';
import type { UserUpdateDto } from './dtos/update-users.dto';
import type { UserResponseDto } from './dtos/users.reponse.dto';
import { User } from './entities/user.entity';
import { mapUserToReponses, mapUsersToResponses } from './users.mapper';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<UserResponseDto>> {
    const sortBy = query.sortBy;
    const sortOrder = query.sortOrder ?? 'ASC';
    const search = query.search?.trim();

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('role.permissions', 'permission')
      .leftJoinAndSelect('user.createdBy', 'createdBy')
      .leftJoinAndSelect('user.updatedBy', 'updatedBy');

    if (search) {
      queryBuilder.andWhere(
        `(
        user.username ILIKE :search
        OR user.staffId ILIKE :search
        OR role.name ILIKE :search
        )`,
        {
          search: `%${search}%`,
        },
      );
    }

    if (sortBy === 'role') {
      queryBuilder.orderBy('role.name', sortOrder);
    } else if (sortBy && sortBy in USER_SORT_FIELDS) {
      queryBuilder.orderBy(
        `user.${USER_SORT_FIELDS[sortBy as keyof typeof USER_SORT_FIELDS]}`,
        sortOrder,
      );
    } else {
      queryBuilder.orderBy('user.createdAt', 'DESC');
    }

    queryBuilder
      .addOrderBy('user.id', 'ASC')
      .skip(getPaginationSkip(query))
      .take(getPaginationTake(query));

    const [users, totalItems] = await queryBuilder.getManyAndCount();

    return buildPaginatedResponse(
      mapUsersToResponses(users),
      totalItems,
      query,
    );
  }
  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.findEntityById(id);

    return mapUserToReponses(user);
  }

  async create(
    dto: UserCreateDto,
    currentUser: AuthenticatedUser,
  ): Promise<UserResponseDto> {
    const creator = await this.findCurrentUserOrThrow(currentUser);

    await this.ensureStaffIdIsAvailable(dto.staffId);
    await this.ensureUsernameIsAvailable(dto.username);

    const role = await this.findRoleByIdOrThrow(dto.roleId);

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = this.userRepository.create({
      staffId: dto.staffId,
      username: dto.username,
      passwordHash,
      role,
      isActive: dto.isActive ?? true,
      createdBy: creator,
      updatedBy: creator,
    });

    await this.userRepository.save(user);

    return this.findOne(user.id);
  }

  async update(
    id: string,
    dto: UserUpdateDto,
    currentUser: AuthenticatedUser,
  ): Promise<UserResponseDto> {
    const updater = await this.findCurrentUserOrThrow(currentUser);
    const user = await this.findEntityById(id);

    if (dto.username && dto.username !== user.username) {
      await this.ensureUsernameIsAvailable(dto.username);
      user.username = dto.username;
    }

    if (dto.staffId && dto.staffId !== user.staffId) {
      await this.ensureStaffIdIsAvailable(dto.staffId);
      user.staffId = dto.staffId;
    }

    if (dto.roleId && dto.roleId !== user.role?.id) {
      user.role = await this.findRoleByIdOrThrow(dto.roleId);
    }

    if (dto.isActive !== undefined) {
      user.isActive = dto.isActive;
    }

    if (dto.password) {
      user.passwordHash = await bcrypt.hash(dto.password, 12);
    }

    user.updatedBy = updater;

    await this.userRepository.save(user);

    return this.findOne(user.id);
  }

  async delete(id: string, currentUser: AuthenticatedUser): Promise<void> {
    const deleter = await this.findCurrentUserOrThrow(currentUser);
    const user = await this.findEntityById(id);

    await this.userRepository.manager.transaction(async (manager) => {
      await manager.update(User, user.id, {
        deletedBy: deleter,
      });

      await manager.softDelete(User, user.id);
    });
  }

  private async findEntityById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: {
        role: {
          permissions: true,
        },
        createdBy: true,
        updatedBy: true,
      },
    });

    if (!user) {
      throw AppError.notFound(AppErrorCode.USER_NOT_FOUND);
    }

    return user;
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

  private async findRoleByIdOrThrow(roleId: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: {
        id: roleId,
      },
    });

    if (!role) {
      throw AppError.notFound(AppErrorCode.ROLE_NOT_FOUND);
    }

    return role;
  }

  private async ensureStaffIdIsAvailable(staffId: string): Promise<void> {
    const existingStaffId = await this.userRepository.findOne({
      where: {
        staffId,
      },
    });

    if (existingStaffId) {
      throw AppError.conflict(AppErrorCode.USER_STAFF_ID_ALREADY_EXISTS);
    }
  }

  private async ensureUsernameIsAvailable(username: string): Promise<void> {
    const existingUser = await this.userRepository.findOne({
      where: {
        username,
      },
    });

    if (existingUser) {
      throw AppError.conflict(AppErrorCode.USER_USERNAME_ALREADY_EXISTS);
    }
  }
}
