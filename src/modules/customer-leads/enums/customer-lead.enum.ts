export enum CustomerLeadSource {
  BOOKING_FORM = 'booking_form',
  BMI_FORM = 'bmi_form',
  CONTACT_FORM = 'contact_form',
  TRIAL_FORM = 'trial_form',
}

export enum CustomerLeadGender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say',
}

export enum BmiCategory {
  UNDERWEIGHT = 'underweight',
  NORMAL = 'normal',
  OVERWEIGHT = 'overweight',
  OBESE = 'obese',
}

export enum CustomerLeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  CONVERTED = 'converted',
  CLOSED = 'closed',
  SPAM = 'spam',
}
