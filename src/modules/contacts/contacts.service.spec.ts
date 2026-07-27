import { Contact } from './entities/contact.entity';
import { ContactsService } from './contacts.service';

describe('ContactsService', () => {
  const user = { id: 'user-1' };
  const currentUser = {
    id: 'user-1',
    username: 'admin',
    role: { id: 'role-1', name: 'ADMIN' },
    permissions: ['system:admin'],
  };
  const dto = {
    addressEn: '123 Main Street',
    addressVi: '123 Duong Chinh',
    hotline: '0900000000',
    email: 'hello@example.com',
    googleMapEmbedUrl: 'https://www.google.com/maps/embed?pb=test',
  };

  const userRepository = { findOne: jest.fn() };
  const contactRepository = {
    find: jest.fn(),
    manager: {
      transaction: jest.fn(),
    },
  };
  let service: ContactsService;

  beforeEach(() => {
    jest.clearAllMocks();
    userRepository.findOne.mockResolvedValue(user);
    service = new ContactsService(
      userRepository as never,
      contactRepository as never,
    );
  });

  it('returns null when no active public contact exists', async () => {
    contactRepository.find.mockResolvedValue([]);

    await expect(service.findPublic()).resolves.toBeNull();
  });

  it('maps only public fields for the public endpoint', async () => {
    contactRepository.find.mockResolvedValue([
      {
        id: 'contact-1',
        ...dto,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: undefined,
        createdBy: user,
      },
    ]);

    await expect(service.findPublic()).resolves.toEqual(dto);
  });

  it.each([
    ['updates an existing singleton', false],
    ['recovers a soft-deleted singleton', true],
  ])('%s', async (_label, deleted) => {
    const existing = {
      id: 'contact-1',
      addressEn: 'Old',
      addressVi: 'Cu',
      hotline: '1',
      email: 'old@example.com',
      googleMapEmbedUrl: 'https://maps.google.com/old',
      deletedAt: deleted ? new Date() : undefined,
    };
    const repository = {
      find: jest
        .fn()
        .mockResolvedValueOnce(deleted ? [] : [existing])
        .mockResolvedValue([existing]),
      create: jest.fn(),
      save: jest.fn((contact: Contact) => Promise.resolve(contact)),
      restore: jest.fn().mockResolvedValue(undefined),
    };
    const manager = {
      getRepository: jest.fn(() => repository),
      update: jest.fn().mockResolvedValue(undefined),
    };
    contactRepository.manager.transaction.mockImplementation(
      (callback: (value: typeof manager) => unknown) =>
        Promise.resolve(callback(manager)),
    );
    contactRepository.find.mockResolvedValue([
      {
        ...existing,
        ...dto,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: undefined,
        createdBy: user,
        updatedBy: user,
      },
    ]);

    await expect(service.update(dto, currentUser)).resolves.toMatchObject(dto);
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ ...dto, updatedBy: user }),
    );
    expect(repository.restore).toHaveBeenCalledTimes(deleted ? 1 : 0);
  });

  it('creates the singleton when no current or deleted record exists', async () => {
    const created = { id: 'contact-1', ...dto };
    const repository = {
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn(() => created),
      save: jest.fn(() => Promise.resolve(created)),
      restore: jest.fn(),
    };
    const manager = { getRepository: jest.fn(() => repository) };
    contactRepository.manager.transaction.mockImplementation(
      (callback: (value: typeof manager) => unknown) =>
        Promise.resolve(callback(manager)),
    );
    contactRepository.find.mockResolvedValue([
      {
        ...created,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: undefined,
        createdBy: user,
        updatedBy: user,
      },
    ]);

    await service.update(dto, currentUser);

    expect(repository.create).toHaveBeenCalledWith({
      ...dto,
      createdBy: user,
      updatedBy: user,
    });
  });
});
