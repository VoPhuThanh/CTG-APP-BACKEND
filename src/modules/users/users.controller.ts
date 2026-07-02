import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UserCreateDto } from './dtos/create-users.dto';
import { UserUpdateDto } from './dtos/update-users.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '@/cores/decorators/current-user.decorators';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-users.interface';
import { PermissionsGuard } from '@/cores/guards/permissions.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Authorized } from '@/cores/decorators/authorized.decorators';
import { PaginationQueryDto } from '@/cores/pagination/pagination-query.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @ApiOperation({ summary: 'Find all users' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    example: 'admin',
  })
  @Authorized('users:read')
  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.usersService.findAll(query);
  }

  @ApiOperation({ summary: 'Find user by id' })
  @Authorized('users:read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @ApiOperation({ summary: 'Create user' })
  @Authorized('users:create')
  @Post()
  create(
    @Body() dto: UserCreateDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.usersService.create(dto, currentUser);
  }

  @ApiOperation({ summary: 'Update user' })
  @Authorized('users:update')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UserUpdateDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.usersService.update(id, dto, currentUser);
  }

  @ApiOperation({ summary: 'Soft delete user' })
  @Authorized('users:delete')
  @Delete(':id')
  delete(
    @Param('id') id: string,
    @CurrentUser() CurrentUser: AuthenticatedUser,
  ) {
    return this.usersService.delete(id, CurrentUser);
  }
}
