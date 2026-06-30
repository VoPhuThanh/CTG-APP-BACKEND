import { ErrorCode } from '@/cores/constants/error-code.constant';
import { Injectable, NotFoundException } from '@nestjs/common';
import { mapUserToReponses, mapUsersToResponses } from './users.mapper';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserCreateDto } from './dtos/create-users.dto';
import { Role } from '../roles/entities/role.entity';
import * as bcrypt from 'bcrypt';
import { HandleError } from '@/cores/serializers/errors/handle.errors';
import { UserResponseDto } from './dtos/users.reponse.dto';
import { UserUpdateDto } from './dtos/update-users.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Role)
    private readonly roleReposistory: Repository<Role>,
  ) {}
  async findAll() {
    const users = await this.userRepository.find({
      relations: {
        role: {
          permissions: true,
        },
      },
    });
    return mapUsersToResponses(users);
  }

  private async findEntityById(id: string): Promise<User> {
    console.log('Searching user id:', id);

    const user = await this.userRepository.findOne({
      where: { id },
      relations: {
        role: {
          permissions: true,
        },
      },
    });
    console.log('Found user:', user);
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
  async create(dto: UserCreateDto): Promise<UserResponseDto> {
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
    });
    await this.userRepository.save(user);
    return this.findOne(user.id);
  }
  async update(id: string, dto: UserUpdateDto): Promise<UserResponseDto> {
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

    await this.userRepository.save(user);
    return this.findOne(user.id);
  }
  async delete(id: string): Promise<UserResponseDto> {
    const user = await this.findEntityById(id);

    user.deletedAt = new Date();

    await this.userRepository.save(user);
    return mapUserToReponses(user);
  }
}
