import { Test, TestingModule } from '@nestjs/testing';
import { CustomerLeadsService } from './customer-leads.service';

describe('CustomerLeadsService', () => {
  let service: CustomerLeadsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CustomerLeadsService],
    }).compile();

    service = module.get<CustomerLeadsService>(CustomerLeadsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
