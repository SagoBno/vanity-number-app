import { COMMON_WORDS } from '../data/commonWords';

const COMMON_WORD_SET = new Set<string>(COMMON_WORDS);
const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);
const RARE_LETTERS = new Set(['Q', 'X', 'Z']);

export function scoreVanityLetters(letters: string): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  if (COMMON_WORD_SET.has(letters)) {
    score += 100;
    reasons.push('matches-common-word');
  }

  const vowelCount = countCharacters(letters, (letter) => VOWELS.has(letter));
  if (vowelCount >= 2 && vowelCount <= 3) {
    score += 20;
    reasons.push('balanced-vowels');
  }

  if (!hasLongRepeatedRun(letters)) {
    score += 15;
    reasons.push('no-long-repeated-run');
  }

  if (letters.length === 7) {
    score += 10;
    reasons.push('full-seven-digit-conversion');
  }

  const rareLetterCount = countCharacters(letters, (letter) => RARE_LETTERS.has(letter));
  score -= rareLetterCount * 4;

  if (rareLetterCount > 0) {
    reasons.push('rare-letter-penalty');
  }

  return { score, reasons };
}

function countCharacters(value: string, predicate: (letter: string) => boolean): number {
  let count = 0;

  for (const letter of value) {
    if (predicate(letter)) {
      count += 1;
    }
  }

  return count;
}

function hasLongRepeatedRun(value: string): boolean {
  let previous = '';
  let runLength = 0;

  for (const letter of value) {
    if (letter === previous) {
      runLength += 1;
    } else {
      previous = letter;
      runLength = 1;
    }

    if (runLength >= 3) {
      return true;
    }
  }

  return false;
}
