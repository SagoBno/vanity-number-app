export interface NormalizedPhoneNumber {
  e164: string;
  digits: string;
  prefixDigits: string;
  vanityDigits: string;
}

export interface VanityCandidate {
  value: string;
  letters: string;
  score: number;
  reasons: string[];
}
