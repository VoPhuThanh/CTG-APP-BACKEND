import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PermissionCreateDto } from './dtos/create-permission.dto';
import { PermissionUpdateDto } from './dtos/update-permission.dto';

@ApiTags('Permissions')
@Controller('permissions')
export class PermissionsController {
  constructor(private permissionsService: PermissionsService) {}

  @ApiOperation({ summary: 'Find all permission' })
  @Get()
  findAll() {
    return this.permissionsService.findAll();
  }

  @ApiOperation({ summary: 'Find permission by id' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.permissionsService.findOne(id);
  }

  @ApiOperation({ summary: 'Create new permission' })
  @Post()
  create(@Body() dto: PermissionCreateDto) {
    return this.permissionsService.create(dto);
  }

  @ApiOperation({ summary: 'Update permission by id' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: PermissionUpdateDto) {
    return this.permissionsService.update(id, dto);
  }
  @ApiOperation({ summary: 'Soft delete permission' })
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.permissionsService.delete(id);
  }
}
