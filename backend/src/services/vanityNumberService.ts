import {
  DEFAULT_MAX_VANITY_CANDIDATES,
  DIGIT_TO_LETTERS,
  LETTER_TO_DIGIT,
} from '../config/constants';
import { COMMON_WORDS } from '../data/commonWords';
import type { VanityCandidate } from '../types/vanityNumber';
import { formatVanityNumber } from '../utils/phoneNumber';
import { scoreVanityLetters } from './vanityScoringService';

export interface GenerateVanityNumbersOptions {
  maxCandidates?: number;
}

export function generateVanityNumbers(
  prefixDigits: string,
  vanityDigits: string,
  options: GenerateVanityNumbersOptions = {},
): VanityCandidate[] {
  const maxCandidates = options.maxCandidates ?? DEFAULT_MAX_VANITY_CANDIDATES;
  const letters = new Set<string>();

  addCommonWordMatches(vanityDigits, letters);
  addGeneratedCombinations(vanityDigits, letters, maxCandidates);

  return [...letters]
    .map((candidateLetters) => {
      const { score, reasons } = scoreVanityLetters(candidateLetters);

      return {
        value: formatVanityNumber(prefixDigits, candidateLetters),
        letters: candidateLetters,
        score,
        reasons,
      };
    })
    .sort(sortCandidates)
    .slice(0, maxCandidates);
}

function addCommonWordMatches(vanityDigits: string, candidates: Set<string>): void {
  for (const word of COMMON_WORDS) {
    if (word.length === vanityDigits.length && wordToDigits(word) === vanityDigits) {
      candidates.add(word);
    }
  }
}

function addGeneratedCombinations(
  vanityDigits: string,
  candidates: Set<string>,
  maxCandidates: number,
): void {
  const current: string[] = [];

  function visit(index: number): void {
    if (candidates.size >= maxCandidates || index === vanityDigits.length) {
      if (index === vanityDigits.length) {
        candidates.add(current.join(''));
      }

      return;
    }

    const digit = vanityDigits[index];
    const possibleLetters = digit === undefined ? '' : DIGIT_TO_LETTERS[digit];

    if (possibleLetters === undefined) {
      return;
    }

    for (const letter of possibleLetters) {
      current.push(letter);
      visit(index + 1);
      current.pop();

      if (candidates.size >= maxCandidates) {
        return;
      }
    }
  }

  visit(0);
}

function wordToDigits(word: string): string {
  return [...word].map((letter) => LETTER_TO_DIGIT[letter] ?? '').join('');
}

function sortCandidates(left: VanityCandidate, right: VanityCandidate): number {
  if (right.score !== left.score) {
    return right.score - left.score;
  }

  return left.letters.localeCompare(right.letters);
}
