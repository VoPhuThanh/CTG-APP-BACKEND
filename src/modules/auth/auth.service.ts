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
    const user = await this.userRepository.findOne({
      where: {
        username: dto.username,
      },
      relations: {
        role: {
          permissions: true,
        },
        createdBy: true,
        updatedBy: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid Username or password');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
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
