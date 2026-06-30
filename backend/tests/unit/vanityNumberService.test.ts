import { generateVanityNumbers } from '../../src/services/vanityNumberService';

describe('generateVanityNumbers', () => {
  it('returns deterministic ranked vanity candidates', () => {
    const candidates = generateVanityNumbers('1800', '3569377', { maxCandidates: 25 });

    expect(candidates[0]?.value).toBe('+1-800-FLOWERS');
    expect(candidates[0]?.letters).toBe('FLOWERS');
    expect(candidates).toHaveLength(25);
  });

  it('respects the max candidate cap', () => {
    const candidates = generateVanityNumbers('1800', '2222222', { maxCandidates: 10 });

    expect(candidates).toHaveLength(10);
  });
});
