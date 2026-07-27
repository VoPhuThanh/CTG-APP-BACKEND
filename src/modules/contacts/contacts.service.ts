import { AppError } from '@/cores/errors/app-error';
import { AppErrorCode } from '@/cores/errors/app-error-code';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import type { AuthenticatedUser } from '../auth/interfaces/authenticated-users.interface';
import { User } from '../users/entities/user.entity';
import {
  mapContactToPublicResponse,
  mapContactToResponse,
} from './contacts.mapper';
import type {
  ContactResponseDto,
  PublicContactResponseDto,
} from './dtos/contact.dto';
import type { ContactUpdateDto } from './dtos/update-contact.dto';
import { Contact } from './entities/contact.entity';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
  ) {}

  async findPublic(): Promise<PublicContactResponseDto | null> {
    const contact = await this.findActiveEntity();

    return contact ? mapContactToPublicResponse(contact) : null;
  }

  async findOne(): Promise<ContactResponseDto | null> {
    const contact = await this.findActiveEntity(true);

    return contact ? mapContactToResponse(contact) : null;
  }

  async update(
    dto: ContactUpdateDto,
    currentUser: AuthenticatedUser,
  ): Promise<ContactResponseDto> {
    const updater = await this.findCurrentUserOrThrow(currentUser);

    let contactId = '';
    await this.contactRepository.manager.transaction(async (manager) => {
      const repository = manager.getRepository(Contact);
      let [contact] = await repository.find({
        order: { createdAt: 'ASC' },
        take: 1,
      });

      if (!contact) {
        [contact] = await repository.find({
          withDeleted: true,
          order: { updatedAt: 'DESC' },
          take: 1,
        });
      }

      if (!contact) {
        contact = repository.create({
          ...dto,
          createdBy: updater,
          updatedBy: updater,
        });
      } else {
        contact.addressEn = dto.addressEn;
        contact.addressVi = dto.addressVi;
        contact.hotline = dto.hotline;
        contact.email = dto.email;
        contact.googleMapEmbedUrl = dto.googleMapEmbedUrl;
        contact.updatedBy = updater;

        if (contact.deletedAt) {
          await repository.restore(contact.id);
          await manager.update(Contact, contact.id, {
            deletedBy: null as never,
          });
          contact.deletedAt = null as never;
          contact.deletedBy = undefined;
        }
      }

      contactId = (await repository.save(contact)).id;
    });

    const contact = await this.findActiveEntity(true);
    if (!contact || contact.id !== contactId) {
      throw AppError.notFound(AppErrorCode.CONTACT_NOT_FOUND);
    }

    return mapContactToResponse(contact);
  }

  async delete(currentUser: AuthenticatedUser): Promise<void> {
    const deleter = await this.findCurrentUserOrThrow(currentUser);
    const contact = await this.findActiveEntity();

    if (!contact) {
      throw AppError.notFound(AppErrorCode.CONTACT_NOT_FOUND);
    }

    await this.contactRepository.manager.transaction(async (manager) => {
      await manager.update(Contact, contact.id, { deletedBy: deleter });
      await manager.softDelete(Contact, contact.id);
    });
  }

  private async findActiveEntity(withAudit = false): Promise<Contact | null> {
    const [contact] = await this.contactRepository.find({
      order: { createdAt: 'ASC' },
      take: 1,
      relations: withAudit
        ? {
            createdBy: true,
            updatedBy: true,
          }
        : undefined,
    });

    return contact ?? null;
  }

  private async findCurrentUserOrThrow(
    currentUser: AuthenticatedUser,
  ): Promise<User> {
    if (!currentUser?.id) {
      throw AppError.unauthorized(AppErrorCode.AUTH_REQUIRED);
    }

    const user = await this.userRepository.findOne({
      where: { id: currentUser.id },
    });

    if (!user) {
      throw AppError.unauthorized(AppErrorCode.CURRENT_USER_NOT_FOUND);
    }

    return user;
  }
}
