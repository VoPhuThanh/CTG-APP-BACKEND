import { CustomerLeadsService } from './customer-leads.service';
import {
  CustomerLeadSource,
  CustomerLeadStatus,
} from './enums/customer-lead.enum';

describe('CustomerLeadsService contact form', () => {
  const customerLeadRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };
  let service: CustomerLeadsService;

  beforeEach(() => {
    jest.clearAllMocks();
    customerLeadRepository.create.mockImplementation(
      (value: Record<string, unknown>) => ({
        id: 'lead-1',
        ...value,
      }),
    );
    customerLeadRepository.save.mockImplementation(
      (value: Record<string, unknown>) => Promise.resolve(value),
    );
    service = new CustomerLeadsService(
      {} as never,
      customerLeadRepository as never,
      {} as never,
      {} as never,
      {} as never,
    );
  });

  it('persists contact-form email, message, and explicit consent', async () => {
    await service.createPublic({
      source: CustomerLeadSource.CONTACT_FORM,
      fullName: 'Nguyen Van A',
      phoneNumber: '0900000000',
      email: 'customer@example.com',
      message: 'Please contact me.',
      consentAccepted: true,
    });

    expect(customerLeadRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        source: CustomerLeadSource.CONTACT_FORM,
        fullName: 'Nguyen Van A',
        phoneNumber: '0900000000',
        email: 'customer@example.com',
        message: 'Please contact me.',
        consentAccepted: true,
        status: CustomerLeadStatus.NEW,
        promotionConsentAccepted: false,
      }),
    );
  });

  it('stores nullable email and message for an existing non-contact source', async () => {
    await service.createPublic({
      source: CustomerLeadSource.BMI_FORM,
      phoneNumber: '0900000000',
      consentAccepted: true,
    });

    expect(customerLeadRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: null,
        message: null,
      }),
    );
  });
});
