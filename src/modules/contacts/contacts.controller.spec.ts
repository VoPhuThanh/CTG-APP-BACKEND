import { REQUIRED_PERMISSIONS_KEY } from '@/cores/decorators/required-permission.decorators';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ContactsController } from './contacts.controller';
import { ContactUpdateDto } from './dtos/update-contact.dto';

describe('ContactsController', () => {
  const contactsService = {
    findPublic: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const controller = new ContactsController(contactsService as never);

  beforeEach(() => jest.clearAllMocks());

  it('returns public fields only through the unauthenticated public handler', async () => {
    const publicContact = {
      addressEn: '123 Main Street',
      addressVi: '123 Duong Chinh',
      hotline: '0900000000',
      email: 'hello@example.com',
      googleMapEmbedUrl: 'https://www.google.com/maps/embed?pb=test',
    };
    contactsService.findPublic.mockResolvedValue(publicContact);

    await expect(controller.findPublic()).resolves.toEqual(publicContact);
    const publicHandler = Object.getOwnPropertyDescriptor(
      ContactsController.prototype,
      'findPublic',
    )?.value as object;
    expect(Reflect.getMetadata(GUARDS_METADATA, publicHandler)).toBeUndefined();
  });

  it.each([
    ['findOne', 'contacts:read'],
    ['update', 'contacts:update'],
    ['delete', 'contacts:delete'],
  ] as const)('protects %s with %s', (method, permission) => {
    expect(
      Reflect.getMetadata(
        REQUIRED_PERMISSIONS_KEY,
        ContactsController.prototype[method],
      ),
    ).toEqual([permission]);
  });

  it.each([
    ['invalid email', { email: 'not-an-email' }],
    ['non-Google URL', { googleMapEmbedUrl: 'https://example.com/map' }],
    [
      'non-HTTPS Google URL',
      { googleMapEmbedUrl: 'http://www.google.com/maps/embed?pb=test' },
    ],
    [
      'iframe HTML',
      {
        googleMapEmbedUrl:
          '<iframe src="https://www.google.com/maps/embed?pb=test"></iframe>',
      },
    ],
  ])('rejects %s', async (_label, override) => {
    const dto = plainToInstance(ContactUpdateDto, {
      addressEn: '123 Main Street',
      addressVi: '123 Duong Chinh',
      hotline: '0900000000',
      email: 'hello@example.com',
      googleMapEmbedUrl: 'https://www.google.com/maps/embed?pb=test',
      ...override,
    });

    expect(await validate(dto)).not.toHaveLength(0);
  });
});
