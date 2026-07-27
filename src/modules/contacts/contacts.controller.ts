import { Authorized } from '@/cores/decorators/authorized.decorators';
import { CurrentUser } from '@/cores/decorators/current-user.decorators';
import { Body, Controller, Delete, Get, Patch } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import type { AuthenticatedUser } from '../auth/interfaces/authenticated-users.interface';
import { ContactsService } from './contacts.service';
import {
  ContactResponseDto,
  PublicContactResponseDto,
} from './dtos/contact.dto';
import { ContactUpdateDto } from './dtos/update-contact.dto';

@ApiTags('Contacts')
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @ApiOperation({ summary: 'Get public Contact page content' })
  @ApiOkResponse({
    description: 'Public Contact page content, or null when not configured.',
    type: PublicContactResponseDto,
  })
  @Get('public')
  findPublic() {
    return this.contactsService.findPublic();
  }

  @ApiOperation({ summary: 'Get the Contact page singleton' })
  @ApiOkResponse({
    description: 'Contact page content, or null when not configured.',
    type: ContactResponseDto,
  })
  @Authorized('contacts:read')
  @Get()
  findOne() {
    return this.contactsService.findOne();
  }

  @ApiOperation({
    summary: 'Create, recover, or update the Contact page singleton',
  })
  @ApiOkResponse({ type: ContactResponseDto })
  @ApiBadRequestResponse({
    description: 'Validation failed for contact content.',
  })
  @Authorized('contacts:update')
  @Patch()
  update(
    @Body() dto: ContactUpdateDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.contactsService.update(dto, currentUser);
  }

  @ApiOperation({ summary: 'Soft delete the Contact page singleton' })
  @ApiOkResponse({ description: 'Contact content soft deleted.' })
  @ApiNotFoundResponse({ description: 'No active contact record exists.' })
  @Authorized('contacts:delete')
  @Delete()
  delete(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.contactsService.delete(currentUser);
  }
}
