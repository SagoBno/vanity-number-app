import { generateVanityNumbers } from '../../src/services/vanityNumberService';

describe('generateVanityNumbers', () => {
  it('returns deterministic ranked vanity candidates', () => {
    const candidates = generateVanityNumbers('1800', '3569377', { maxCandidates: 25 });

    expect(candidates[0]?.value).toBe('+1-800-FLOWERS');
    expect(candidates[0]?.letters).toBe('FLOWERS');
    expect(candidates).toHaveLength(25);
  });

  it('prefers partial word candidates over arbitrary letter combinations', () => {
    const candidates = generateVanityNumbers('1800', '2255123', { maxCandidates: 10 });

    expect(candidates[0]?.value).toBe('+1-800-CALL123');
    expect(candidates[0]?.letters).toBe('CALL123');
    expect(candidates[0]?.reasons).toContain('contains-common-word');
  });

  it('respects the max candidate cap', () => {
    const candidates = generateVanityNumbers('1800', '2222222', { maxCandidates: 10 });

    expect(candidates).toHaveLength(10);
  });
});
