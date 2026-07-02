import { ErrorCode } from '@/cores/constants/error-code.constant';
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { mapUserToReponses, mapUsersToResponses } from './users.mapper';
import { InjectRepository } from '@nestjs/typeorm';
import { type Repository } from 'typeorm';
import { User } from './entities/user.entity';
import type { UserCreateDto } from './dtos/create-users.dto';
import { Role } from '../roles/entities/role.entity';
import * as bcrypt from 'bcrypt';
import { HandleError } from '@/cores/serializers/errors/handle.errors';
import type { UserResponseDto } from './dtos/users.reponse.dto';
import type { UserUpdateDto } from './dtos/update-users.dto';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-users.interface';
import { PaginationQueryDto } from '@/cores/pagination/pagination-query.dto';
import { PaginatedResponseDto } from '@/cores/pagination/pagination-response.dto';
import {
  buildPaginatedResponse,
  getPaginationSkip,
  getPaginationTake,
} from '@/cores/pagination/pagination-utils';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Role)
    private readonly roleReposistory: Repository<Role>,
  ) {}
  async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<UserResponseDto>> {
    const [users, totalItems] = await this.userRepository.findAndCount({
      relations: {
        role: {
          permissions: true,
        },
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
      mapUsersToResponses(users),
      totalItems,
      query,
    );
  }

  private async findEntityById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: {
        role: {
          permissions: true,
        },
      },
    });
    if (!user) {
      throw new NotFoundException({
        statusCode: 404,
        code: ErrorCode.USER_NOT_FOUND,
        message: 'User not found',
      });
    }
    return user;
  }
  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.findEntityById(id);
    return mapUserToReponses(user);
  }
  async create(
    dto: UserCreateDto,
    currentUser: AuthenticatedUser,
  ): Promise<UserResponseDto> {
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
    const existingUser = await this.userRepository.findOne({
      where: {
        username: dto.username,
      },
    });
    if (existingUser) {
      throw HandleError.badRequest({
        code: 'DATA.DATA_ALREADY_EXIST',
      });
    }

    const role = await this.roleReposistory.findOne({
      where: {
        id: dto.roleId,
      },
    });
    if (!role) {
      throw HandleError.badRequest({
        code: 'DATA.DATA_DOESNT_EXIST',
      });
    }
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.userRepository.create({
      username: dto.username,
      passwordHash,
      role,
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
    const user = await this.findEntityById(id);

    if (dto.username) user.username = dto.username;
    if (dto.roleId) {
      const role = await this.roleReposistory.findOne({
        where: {
          id: dto.roleId,
        },
      });
      if (!role) {
        throw HandleError.badRequest({
          code: 'DATA.DATA_DOESNT_EXIST',
        });
      }
      user.role = role;
    }
    if (dto.password) user.passwordHash = await bcrypt.hash(dto.password, 12);

    user.updatedBy = updater;

    await this.userRepository.save(user);
    return this.findOne(user.id);
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
    const user = await this.findEntityById(id);

    await this.userRepository.manager.transaction(async (manager) => {
      await manager.update(User, user.id, {
        deletedBy: deleter,
      });
      await manager.softDelete(User, user.id);
    });
  }
}
