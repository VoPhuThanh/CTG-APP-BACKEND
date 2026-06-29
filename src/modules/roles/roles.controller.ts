import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleCreateDto } from './dtos/create-role.dto';
import { RoleUpdateDto } from './dtos/update-role.dto';

@ApiTags('Roles')
@Controller('roles')
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @ApiOperation({ summary: 'Find all roles' })
  @Get()
  findAll() {
    return this.rolesService.findAll();
  }

  @ApiOperation({ summary: 'Find roles by id' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @ApiOperation({ summary: 'Create roles' })
  @Post()
  create(@Body() dto: RoleCreateDto) {
    return this.rolesService.create(dto);
  }

  @ApiOperation({ summary: 'Update roles' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: RoleUpdateDto) {
    return this.rolesService.update(id, dto);
  }
  @ApiOperation({ summary: 'Soft delete roles' })
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.rolesService.delete(id);
  }
}
