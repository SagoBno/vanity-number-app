import { COMMON_WORDS } from '../data/commonWords';

const COMMON_WORD_SET = new Set<string>(COMMON_WORDS);
const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);
const RARE_LETTERS = new Set(['Q', 'X', 'Z']);
const AWKWARD_LETTERS = new Set(['J', 'K']);

export function scoreVanityLetters(letters: string): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  if (COMMON_WORD_SET.has(letters)) {
    score += 150;
    reasons.push('matches-common-word');
  }

  const embeddedWordLength = findLongestEmbeddedWordLength(letters);
  if (!COMMON_WORD_SET.has(letters) && embeddedWordLength >= 3) {
    score += 35 + embeddedWordLength * 8;
    reasons.push('contains-common-word');
  }

  const letterCount = countCharacters(letters, isAlphabetic);
  const digitCount = letters.length - letterCount;
  const vowelCount = countCharacters(letters, (letter) => VOWELS.has(letter));

  if (vowelCount >= 2 && vowelCount <= 3) {
    score += 20;
    reasons.push('balanced-vowels');
  }

  if (!hasLongRepeatedRun(letters)) {
    score += 15;
    reasons.push('no-long-repeated-run');
  }

  const longestConsonantRun = getLongestConsonantRun(letters);
  if (longestConsonantRun <= 3) {
    score += 15;
    reasons.push('pronounceable-consonant-run');
  } else if (longestConsonantRun === 4) {
    score += 5;
    reasons.push('acceptable-consonant-run');
  }

  const vowelConsonantTransitions = countVowelConsonantTransitions(letters);
  score += Math.min(vowelConsonantTransitions * 2, 12);

  if (letters.length === 7 && digitCount === 0) {
    score += 10;
    reasons.push('full-seven-digit-conversion');
  }

  const rareLetterCount = countCharacters(letters, (letter) => RARE_LETTERS.has(letter));
  score -= rareLetterCount * 4;

  if (rareLetterCount > 0) {
    reasons.push('rare-letter-penalty');
  }

  const awkwardLetterCount = countCharacters(letters, (letter) => AWKWARD_LETTERS.has(letter));
  score -= awkwardLetterCount * 2;

  if (awkwardLetterCount > 0) {
    reasons.push('awkward-letter-penalty');
  }

  if (digitCount > 0) {
    score -= digitCount * 3;
    reasons.push('retains-some-digits');
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

function findLongestEmbeddedWordLength(value: string): number {
  let longest = 0;

  for (const word of COMMON_WORDS) {
    if (word.length >= 3 && value.includes(word)) {
      longest = Math.max(longest, word.length);
    }
  }

  return longest;
}

function getLongestConsonantRun(value: string): number {
  let longest = 0;
  let current = 0;

  for (const character of value) {
    if (isAlphabetic(character) && !VOWELS.has(character)) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }

  return longest;
}

function countVowelConsonantTransitions(value: string): number {
  let transitions = 0;
  let previousKind: 'vowel' | 'consonant' | undefined;

  for (const character of value) {
    if (!isAlphabetic(character)) {
      continue;
    }

    const currentKind = VOWELS.has(character) ? 'vowel' : 'consonant';

    if (previousKind !== undefined && previousKind !== currentKind) {
      transitions += 1;
    }

    previousKind = currentKind;
  }

  return transitions;
}

function isAlphabetic(character: string): boolean {
  return /^[A-Z]$/.test(character);
}
