import { scoreVanityLetters } from '../../src/services/vanityScoringService';

describe('scoreVanityLetters', () => {
  it('rewards known memorable words', () => {
    const result = scoreVanityLetters('FLOWERS');

    expect(result.score).toBeGreaterThan(100);
    expect(result.reasons).toContain('matches-common-word');
  });

  it('penalizes rare letters', () => {
    const common = scoreVanityLetters('FLOWERS');
    const rare = scoreVanityLetters('ZLOWERZ');

    expect(rare.score).toBeLessThan(common.score);
    expect(rare.reasons).toContain('rare-letter-penalty');
  });
});
