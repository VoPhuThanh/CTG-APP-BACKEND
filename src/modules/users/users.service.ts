import { ErrorCode } from '@/cores/constants/error-code.constant';
import { Injectable, NotFoundException } from '@nestjs/common';
import { mapUserToReponses } from './users.mapper';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}
  async findAll() {
    const user = await this.userRepository.find({
      relations: {
        role: true,
      },
    });
    return mapUserToReponses(user);
  }
  async findOne(id: string) {
    const user = await this.userRepository.findOne({
      where: {
        id,
      },
      relations: {
        role: true,
      },
    });
    if (!user) {
      throw new NotFoundException({
        statusCode: 404,
        code: ErrorCode.USER_NOT_FOUND,
        message: 'User not found',
      });
    }
    return mapUserToReponses(user);
  }
}
