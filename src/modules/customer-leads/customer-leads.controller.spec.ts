import { Test, TestingModule } from '@nestjs/testing';
import { CustomerLeadsController } from './customer-leads.controller';

describe('CustomerLeadsController', () => {
  let controller: CustomerLeadsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomerLeadsController],
    }).compile();

    controller = module.get<CustomerLeadsController>(CustomerLeadsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
