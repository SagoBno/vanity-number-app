import { formatVanityNumber, normalizePhoneNumber } from '../../src/utils/phoneNumber';

describe('normalizePhoneNumber', () => {
  it('normalizes formatted US phone numbers to E.164-like digits', () => {
    const result = normalizePhoneNumber('+1 (800) 356-9377');

    expect(result).toEqual({
      e164: '+18003569377',
      digits: '18003569377',
      prefixDigits: '1800',
      vanityDigits: '3569377',
    });
  });

  it('rejects blank input', () => {
    expect(() => normalizePhoneNumber('   ')).toThrow('Phone number is required.');
  });

  it('rejects numbers with too few digits', () => {
    expect(() => normalizePhoneNumber('555-123')).toThrow(
      'Phone number must contain 10 to 15 digits.',
    );
  });
});

describe('formatVanityNumber', () => {
  it('formats a US toll-free style prefix readably', () => {
    expect(formatVanityNumber('1800', 'FLOWERS')).toBe('+1-800-FLOWERS');
  });

  it('keeps non-US prefixes visible', () => {
    expect(formatVanityNumber('57300', 'SERVICE')).toBe('+57300-SERVICE');
  });
});
