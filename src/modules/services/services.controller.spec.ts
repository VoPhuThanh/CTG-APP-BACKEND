import { PaginationQueryDto } from '@/cores/pagination/pagination-query.dto';
import { Test, TestingModule } from '@nestjs/testing';

import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';

describe('ServicesController', () => {
  let controller: ServicesController;
  const servicesService = {
    findPublicServiceVariants: jest.fn(),
    findPublicServiceVariantBySlug: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServicesController],
      providers: [
        {
          provide: ServicesService,
          useValue: servicesService,
        },
      ],
    }).compile();

    controller = module.get<ServicesController>(ServicesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates public variant pagination by service slug', () => {
    const query = Object.assign(new PaginationQueryDto(), {
      page: 2,
      limit: 9,
    });
    const response = {
      data: [],
      meta: {
        page: 2,
        limit: 9,
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: true,
      },
    };
    servicesService.findPublicServiceVariants.mockReturnValue(response);

    expect(controller.findPublicServiceVariants('group-classes', query)).toBe(
      response,
    );
    expect(servicesService.findPublicServiceVariants).toHaveBeenCalledWith(
      'group-classes',
      query,
    );
  });

  it('delegates public variant detail by nested slugs', () => {
    const response = { id: 'variant-1' };
    servicesService.findPublicServiceVariantBySlug.mockReturnValue(response);

    expect(
      controller.findPublicServiceVariantBySlug(
        'group-classes',
        'strength-foundations',
      ),
    ).toBe(response);
    expect(servicesService.findPublicServiceVariantBySlug).toHaveBeenCalledWith(
      'group-classes',
      'strength-foundations',
    );
  });
});
