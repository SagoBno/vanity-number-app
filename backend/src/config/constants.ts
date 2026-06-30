export const DEFAULT_TTL_DAYS = 30;
export const DEFAULT_MAX_VANITY_CANDIDATES = 1000;
export const VANITY_DIGIT_COUNT = 7;

export const DIGIT_TO_LETTERS: Readonly<Record<string, string>> = {
  '0': '0',
  '1': '1',
  '2': 'ABC',
  '3': 'DEF',
  '4': 'GHI',
  '5': 'JKL',
  '6': 'MNO',
  '7': 'PQRS',
  '8': 'TUV',
  '9': 'WXYZ',
};

export const LETTER_TO_DIGIT: Readonly<Record<string, string>> = Object.entries(
  DIGIT_TO_LETTERS,
).reduce<Record<string, string>>((accumulator, [digit, letters]) => {
  for (const letter of letters) {
    accumulator[letter] = digit;
  }

  return accumulator;
}, {});
