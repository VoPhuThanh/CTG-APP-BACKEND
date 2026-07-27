import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CustomerLeadCreateDto } from './dtos/create-customer-lead.dto';
import { CustomerLeadSource } from './enums/customer-lead.enum';

describe('customer lead public-create validation', () => {
  const contactForm = {
    source: CustomerLeadSource.CONTACT_FORM,
    fullName: 'Nguyen Van A',
    phoneNumber: '0900000000',
    email: 'customer@example.com',
    message: 'Please tell me more about CTG memberships.',
    consentAccepted: true,
  };

  async function validatePayload(payload: Record<string, unknown>) {
    return validate(plainToInstance(CustomerLeadCreateDto, payload));
  }

  it('accepts a complete contact form and trims its text fields', async () => {
    const dto = plainToInstance(CustomerLeadCreateDto, {
      ...contactForm,
      fullName: '  Nguyen Van A  ',
      email: '  customer@example.com  ',
      message: '  Please contact me.  ',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto).toMatchObject({
      fullName: 'Nguyen Van A',
      email: 'customer@example.com',
      message: 'Please contact me.',
    });
  });

  it.each([
    ['fullName', undefined],
    ['email', undefined],
    ['message', undefined],
    ['email', 'not-an-email'],
    ['consentAccepted', false],
  ])('rejects contact_form with invalid %s', async (field, value) => {
    const errors = await validatePayload({ ...contactForm, [field]: value });

    expect(errors.some((error) => error.property === field)).toBe(true);
  });

  it.each([
    CustomerLeadSource.BOOKING_FORM,
    CustomerLeadSource.BMI_FORM,
    CustomerLeadSource.TRIAL_FORM,
  ])('keeps %s valid without email and message', async (source) => {
    await expect(
      validatePayload({
        source,
        phoneNumber: '0900000000',
        consentAccepted: true,
      }),
    ).resolves.toHaveLength(0);
  });
});
