import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dtos/login.dto';
import { LoginReponseDto } from './dtos/login-response.dto';
import { Repository } from 'typeorm/repository/Repository.js';
import * as bcrypt from 'bcrypt';
import { mapToAuthenticatedUser } from './auth.mapper';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly jwtService: JwtService,
  ) {}
  async login(dto: LoginDto): Promise<LoginReponseDto> {
    const { username, password } = dto;

    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('role.permissions', 'permission')
      .leftJoinAndSelect('user.createdBy', 'createdBy')
      .leftJoinAndSelect('user.updatedBy', 'updatedBy')
      .addSelect('user.passwordHash')
      .where('user.username = :username', { username })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('Invalid Username or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid Username or password');
    }

    const payload = {
      sub: user.id,
      username: user.username,
      roleId: user.role.id,
      roleName: user.role.name,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: mapToAuthenticatedUser(user),
    };
  }
}
