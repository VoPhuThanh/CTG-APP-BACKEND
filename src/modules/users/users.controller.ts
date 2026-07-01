import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UserCreateDto } from './dtos/create-users.dto';
import { UserUpdateDto } from './dtos/update-users.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@/cores/decorators/current-user.decorators';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-users.interface';
import { Authenticated } from '@/cores/decorators/authenticated.decorators';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Find all users' })
  @Authenticated()
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @ApiOperation({ summary: 'Find user by id' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @ApiOperation({ summary: 'Create user' })
  @Authenticated()
  @Post()
  create(
    @Body() dto: UserCreateDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.usersService.create(dto, currentUser);
  }

  @ApiOperation({ summary: 'Update user' })
  @Authenticated()
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UserUpdateDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.usersService.update(id, dto, currentUser);
  }

  @ApiOperation({ summary: 'Soft delete user' })
  @Authenticated()
  @Delete(':id')
  delete(
    @Param('id') id: string,
    @CurrentUser() CurrentUser: AuthenticatedUser,
  ) {
    return this.usersService.delete(id, CurrentUser);
  }
}
