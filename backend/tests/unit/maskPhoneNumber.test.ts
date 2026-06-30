import { maskPhoneNumber } from '../../src/utils/maskPhoneNumber';

describe('maskPhoneNumber', () => {
  it('keeps only the last four digits visible', () => {
    expect(maskPhoneNumber('+1 (800) 356-9377')).toBe('+*******9377');
  });

  it('does not leak very short inputs', () => {
    expect(maskPhoneNumber('123')).toBe('****');
  });
});
