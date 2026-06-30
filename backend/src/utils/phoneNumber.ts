import { VANITY_DIGIT_COUNT } from '../config/constants';
import type { NormalizedPhoneNumber } from '../types/vanityNumber';

export class InvalidPhoneNumberError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPhoneNumberError';
  }
}

export function normalizePhoneNumber(rawPhoneNumber: string): NormalizedPhoneNumber {
  const trimmed = rawPhoneNumber.trim();

  if (trimmed.length === 0) {
    throw new InvalidPhoneNumberError('Phone number is required.');
  }

  const digits = trimmed.replace(/\D/g, '');

  if (digits.length < 10 || digits.length > 15) {
    throw new InvalidPhoneNumberError('Phone number must contain 10 to 15 digits.');
  }

  const vanityDigits = digits.slice(-VANITY_DIGIT_COUNT);
  const prefixDigits = digits.slice(0, -VANITY_DIGIT_COUNT);

  return {
    e164: `+${digits}`,
    digits,
    prefixDigits,
    vanityDigits,
  };
}

export function formatVanityNumber(prefixDigits: string, vanityLetters: string): string {
  if (prefixDigits.length === 0) {
    return vanityLetters;
  }

  if (prefixDigits.startsWith('1') && prefixDigits.length === 4) {
    return `+1-${prefixDigits.slice(1)}-${vanityLetters}`;
  }

  if (prefixDigits.startsWith('1') && prefixDigits.length > 4) {
    return `+1-${prefixDigits.slice(1, 4)}-${prefixDigits.slice(4)}-${vanityLetters}`;
  }

  return `+${prefixDigits}-${vanityLetters}`;
}
